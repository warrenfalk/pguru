import React, {useState, useEffect} from 'react';
import { Box, Text } from "ink";

export const Counter = () => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(count => count + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return <Text color="green">{count} tests passed</Text>;
};

type TestProps = {
    test: number
}
export const Test: React.FC<TestProps> = ({test}) => {
    if (test === 1) {
        return (
            <Box flexDirection="column">
                <Text>One</Text>
                <Text>Two</Text>
                <Counter />
            </Box>
        )
    }
    else {
        return (
            <Text>Done...</Text>
        )
    }
}


