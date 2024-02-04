import { ChildProcessWithoutNullStreams } from "node:child_process";
import { LineBuffer } from "./lineBuffer.js";

export type Proc = {
    readonly id: string;
    readonly title: string;
    readonly command: readonly string[];
    readonly cwd?: string;
}

export type ProcState =  UnlaunchedProc | LaunchedProc | FailedProc | FinishedProc;

export type ProcOutput = {
    readonly lines: LineBuffer;
}

export type UnlaunchedProc = ProcOutput & {
    status: "unlaunched";
}

export type LaunchedProc = ProcOutput & {
    status: "launched";
    readonly childProcess: ChildProcessWithoutNullStreams;
    readonly killRequested: boolean;
}

export type FailedProc = ProcOutput & {
    status: "error";
    readonly error: Error;
}

export type FinishedProc = ProcOutput & {
    status: "finished";
    readonly code: number | null;
}