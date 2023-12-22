import React from "react";
import styled from "@emotion/styled";

const Container = styled.div<{ width: string; color: string }>`
    progress[value] {
        width: ${props => props.width};
        will-change: width;
        transition: width 150ms ease-in;
        -webkit-appearance: none;
        appearance: none;
    }

    progress[value]::-webkit-progress-bar {
        height: 10px;
        border-radius: 20px;
        background-color: #eee;
    }

    progress[value]::-webkit-progress-value {
        height: 10px;
        border-radius: 20px;
        background-color: ${props => props.color};
    }
`;

interface ProgressBarProps {
    value: number;
    max: number;
    color: string;
    width: string;
}

const ProgressBar = ({ value, max, color, width }: ProgressBarProps) => {
    return (
        <Container color={color} width={width}>
            <progress value={value} max={max} />
        </Container>
    );
};

export default ProgressBar;
