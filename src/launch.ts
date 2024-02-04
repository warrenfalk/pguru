import { spawn } from 'child_process';
import { FailedProc, FinishedProc, LaunchedProc, Proc, ProcState } from './model.js';
import { push } from './lineBuffer.js';

export type ProcsState = {
    [name: string]: ProcAndState
}
export type ProcAndState = {
    proc: Proc,
    state: ProcState,
}
type ProcsStateObserver = (next: ProcsState) => void;

export type ProcsInstance = {
    observe: (fn: ProcsStateObserver) => () => void;
    getState(): ProcsState;
    killAll(): void;
}

function toObj<T, K extends string | number | symbol, V>(array: readonly T[], key: (t: T) => K, value: (t: T) => V): Record<K, V> {
    const obj = {} as Record<K, V>;
    for (const t of array) {
        obj[key(t)] = value(t);
    }
    return obj;
}

const defaultState: ProcState = {
    status: 'unlaunched',
    lines: {
        state: {blocks: []},
        config: {
            blockSize: 1000,
            maxSize: 100000,
        }
    }
};

export function launchProcs(procs: readonly Proc[]): ProcsInstance {
    const instance = ((initial: ProcsState) => {
        let state = initial;
        let nextId = 1;
        const observers = new Map<number,ProcsStateObserver>();
        for (const [id, proc] of Object.entries(initial)) {
            let procState = proc.state;
            launchProc(proc.proc, proc.state, (nextState: ProcState) => {
                if (procState !== nextState) {
                    procState = nextState;
                    state = {...state, [id]: {proc: proc.proc, state: nextState}};
                    for (const [_, observer] of observers) {
                        observer(state);
                    }
                }
            });
        }
        const unobserve = (id: number) => {
            observers.delete(id);
        }
        const observe = (fn: ProcsStateObserver) => {
            const id = nextId;
            nextId++;
            observers.set(id, fn);
            fn(state);
            return () => unobserve(id);
        }
        const getState = () => state;
        const killAll = (signal: string = 'SIGTERM') => {
            for (const [id, proc] of Object.entries(state)) {
                const procState = proc.state;
                if (procState.status === 'launched') {
                    const {childProcess} = procState;
                    const pid = childProcess.pid!;
                    childProcess.stdin.end();
                    process.kill(-pid, signal);
                }
            }
        }
        return {observe, getState, killAll}
    })(toObj(procs, p => p.id, p => ({proc: p, state: defaultState})))
    return instance;
}


export type ProcStateHandler = (procState: ProcState) => void;

export function launchProc(proc: Proc, initialProcState: ProcState, procStateDidChange: ProcStateHandler) {
    const {command, cwd} = proc;
    const [exe, ...args] = command;

    if (exe === undefined) {
        procStateDidChange({...initialProcState, status: 'error', error: new Error('No command specified')});
        return;
    }

    const env = { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: 'true'};

    const childProcess = spawn(
        exe,
        args,
        {
            cwd,
            env,
            shell: true,
            detached: true, // it is important this be detached because we need to kill the whole group
                            // killing a process that has started other child processes doesn't work
                            // but those children will be in the same group and we can kill the group
                            // we just need to make sure that we're not in that group, which is what detached does
        });

    let state: LaunchedProc = {
        ...initialProcState,
        status: 'launched',
        childProcess,
        killRequested: false,
    };
        
    childProcess.stdout.on('data', (data: Buffer) => {
        const d = data.toString('utf8');
        const lines = d.split('\n');
        state = {...state, lines: push(state.lines, lines)}
        procStateDidChange(state);
    });

    childProcess.stderr.on('data', (data) => {
        const d = data.toString('utf8');
        const lines = d.split('\n');
        state = {...state, lines: push(state.lines, lines)}
        procStateDidChange(state);
    });

    childProcess.on('close', (code) => {
        const {lines} = state;
        const finished: FinishedProc = {lines, status: 'finished', code};
        procStateDidChange(finished);
    });

    childProcess.on('error', (err) => {
        const {lines} = state;
        const failed: FailedProc = {lines, status: 'error', error: err};
        procStateDidChange(failed);
    });
}

export function killProc(procState: ProcState): ProcState {
    if (procState.status === 'launched') {
        const {childProcess} = procState;
        const pid = procState.childProcess.pid!;
        procState.childProcess.stdin.end();
        procState.childProcess.kill('SIGTERM');
        process.kill(-pid);
        return {...procState, killRequested: true};
    }
    return procState;
}
