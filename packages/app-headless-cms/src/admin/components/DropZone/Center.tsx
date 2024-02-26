import React, { CSSProperties } from "react";
import styled from "@emotion/styled";
import { Droppable, DroppableProps, OnDropCallable } from "./../Droppable";

interface DroppableFlags {
    isOver: boolean;
    isDroppable: boolean;
}

const getColor = ({ isOver, isDroppable }: DroppableFlags) => {
    if (isOver) {
        return "var(--mdc-theme-primary)";
    }

    if (!isDroppable) {
        return "var(--mdc-theme-background)";
    }

    return "var(--mdc-theme-secondary)";
};

const Container = styled.div`
    background-color: transparent;
    box-sizing: border-box;
    height: 100%;
    min-height: 100px;
    position: relative;
    user-select: none;
    width: 100%;
    border: 2px dashed ${getColor};
    opacity: 1;
    > div {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin: 0;
        color: ${getColor};
    }
`;

interface CenterProps {
    type?: string;
    onDrop: OnDropCallable;
    children: React.ReactNode;
    active?: boolean;
    highlight?: boolean;
    style?: CSSProperties;
    isDroppable?: DroppableProps["isDroppable"];
}

const getInert = (isDroppable: boolean) => {
    return isDroppable ? {} : { inert: "" };
};

const Center = ({ onDrop, children, style, isDroppable }: CenterProps) => {
    return (
        <Droppable onDrop={onDrop} isDroppable={isDroppable}>
            {({ isOver, drop, isDroppable }) => (
                <div
                    ref={drop}
                    style={{ width: "100%", height: "100%", ...style }}
                    data-testid={"cms-editor-first-field-area"}
                    {...getInert(isDroppable)}
                >
                    <Container isOver={isOver} isDroppable={isDroppable}>
                        <div>{children}</div>
                    </Container>
                </div>
            )}
        </Droppable>
    );
};

export default Center;
