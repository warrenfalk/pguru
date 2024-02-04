import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import { Proc, ProcState } from './model.js';
import { createLineBuffer, size } from './lineBuffer.js';
import { killProc, launchProc, ProcAndState, ProcsState } from './launch.js';
import { Counter } from './test.js';

function useStdoutDimensions(): [number, number] {
    const [size, setSize] = useState({
        columns: process.stdout.columns,
        rows: process.stdout.rows,
    });
    useEffect(() => {
		function onResize() {
			setSize({
				columns: process.stdout.columns,
				rows: process.stdout.rows,
			});
		}

		process.stdout.on("resize", onResize);
		process.stdout.write("\x1b[?1049h");
		return () => {
			process.stdout.off("resize", onResize);
			process.stdout.write("\x1b[?1049l");
		};
	}, []);
    return [size.columns, size.rows];
}

type ProcItemProps = {
    proc: Proc;
    selected: boolean;
}
const ProcItem: React.FC<ProcItemProps> = ({proc, selected}) => {
    return <Text color={selected ? "blue" : undefined}>{` ${proc.title} `}</Text>
}

type ProcListProps = {
    procs: readonly Proc[],
    width?: number,
    selected?: string,
}
const ProcList: React.FC<ProcListProps> = ({procs, selected, width = 20}) => {
    return (
        <Box flexDirection="column" flexBasis={width}>
            {procs.map(proc => <ProcItem key={proc.title} proc={proc} selected={proc.id === selected} />)}
        </Box>
    )
}

type AppProps = {
    procsState: ProcsState;
}
export const App: React.FC<AppProps> = ({procsState}) => {
    const all = Object.values<ProcAndState>(procsState);
    const procs = all.map(({proc}) => proc);
    const [columns, rows] = useStdoutDimensions();
    const [selectedProcId, setSelectedProcId] = useState<string|undefined>(() => procs[0]?.id);
    const selectedProc = selectedProcId ? procsState[selectedProcId] : undefined;
    const proc = selectedProc?.proc;
    const state = selectedProc?.state;
    return (
        <Box height={rows} width={columns} flexDirection="row" flexGrow={1}>
            <ProcList procs={procs} selected={selectedProcId}/>
            <Box flexGrow={1} flexDirection='column'>
                <Counter />
                <Text>{`Selected: ${selectedProcId}`}</Text>
                <Text>{`Title: ${proc?.title}`}</Text>
                <Text>{`Lines: ${size(state!.lines)}`}</Text>
            </Box>
        </Box>
    )
}

