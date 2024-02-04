export type LineBuffer = {
    readonly state: LineBufferState;
    readonly config: LineBufferConfig;
}

export type LineBufferState = {
    readonly blocks: readonly LineBufferBlock[];
}

export type LineBufferBlock = readonly string[];

export type LineBufferConfig = {
    blockSize: number;
    maxSize: number;
}

export function lines (lb: LineBuffer, start?: number, end?: number): Iterable<string> {
    return lb.state.blocks.flatMap(block => block).slice(start, end);
}

export function push (lb: LineBuffer, lines: readonly string[]): LineBuffer {
    const newBlocks = [...lb.state.blocks, lines];
    return {
        ...lb,
        state: { blocks: newBlocks },
    };
}

export function size(lb: LineBuffer): number {
    return lb.state.blocks.reduce((acc, block) => acc + block.length, 0);
}

const defaultConfig: LineBufferConfig = {
    blockSize: 1000,
    maxSize: 100000,
};

export function createLineBuffer(config: Partial<LineBufferConfig> = {}): LineBuffer {
    return {
        state: { blocks: [] },
        config: {...defaultConfig, ...config},
    };
}