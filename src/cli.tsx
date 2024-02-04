#!/usr/bin/env node
import React, { useEffect, useState } from 'react';
import {Box, render, Text} from 'ink';
//import meow from 'meow';
import {App} from './index.js';
import { Proc, ProcState } from './model.js';
import { launchProcs, ProcsInstance } from './launch.js';

// const cli = meow(
// 	`
// 	Usage
// 	 $ ink-app-template
// 
// 	Options
// 		--name  Your name
// 
// 	Examples
// 	 $ ink-app-template --name=Jane
// 	 Hello, Jane
// `,
// 	{
// 		importMeta: import.meta,
// 		flags: {
// 			name: {
// 				type: 'string',
// 			},
// 		},
// 	},
// );

const procs: readonly Proc[] = [
    //{
    //    title: "Watch Extension",
    //    command: ["yarn", "build:watch"],
    //    cwd: "/home/warren/source/comprensible/extension"
    //},
    //{
    //    title: "Watch Functions",
    //    command: ["yarn", "build:watch"],
    //    cwd: "/home/warren/source/comprensible/firebase/functions"
    //},
    {
        id: "serve-functions",
        title: "Serve Functions",
        command: ["yarn", "serve"],
        cwd: "/home/warren/source/comprensible/firebase/functions"
    },
];

const instance = launchProcs(procs);
const useProcStates = (instance: ProcsInstance) => {
    const [procStates, setProcState] = useState(() => instance.getState());
    useEffect(() => {
        const unobserve = instance.observe((procStates) => {
            setProcState(procStates);
        });
        return () => {
            unobserve();
        }
    }, [instance]);
    return procStates;
}

const WithStates: React.FC = () => {
    const procsState = useProcStates(instance);
    const [show, setShow] = useState(true);
    useEffect(() => {
        const interval = setInterval(() => {
            setShow(show => !show);
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const isExiting = Object.values(procsState).every(state => state.state.status !== "launched" || state.state.killRequested);

    return show ? <Box><Text>Exiting...</Text></Box> : <App procsState={procsState} />;
}

const ink = render(<WithStates />);

process.stdin.resume();
process.on('exit', () => {
    console.error('exit');
    // here we can't block so we just send the kill signal and hope for the best
    // we can trap the "quit" signal separately and do a more graceful shutdown
    instance.killAll();
})
process.on('SIGINT', () => {
    console.error('SIGINT');
    instance.killAll();
    setTimeout(() => {
        ink.waitUntilExit();
        process.exit(0);
    }, 4000);
});
process.on('uncaughtException', (err) => {
    console.error(err);
    instance.killAll();
    process.exit(1);
});

/*
const ExitingApp = () => (<Text>Exiting...</Text>);

const {rerender} = render(<App procs={procs}/>);

process.stdin.resume();

function exitHandler(options: {exit: boolean}, exitCode: number) {
    rerender(<ExitingApp />);
    if (options.exit) {
        setTimeout(() => {
            process.exit();
        }, 4000)
    }
}

process.on('exit', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
*/