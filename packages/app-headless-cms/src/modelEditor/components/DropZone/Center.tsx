import React, { CSSProperties } from "react";
import styled from "@emotion/styled";
import { Droppable, OnDropCallable } from "./../Droppable";

// @ts-ignore
const Container = styled("div")(({ isOver }: { isOver: boolean }) => ({
    backgroundColor: "transparent",
    boxSizing: "border-box",
    height: "100%",
    minHeight: 100,
    position: "relative",
    userSelect: "none",
    width: "100%",
    border: isOver
        ? "2px dashed var(--mdc-theme-primary)"
        : "2px dashed var(--mdc-theme-secondary)",
    opacity: 1
}));

// @ts-ignore
const Add = styled("div")(({ isOver }: { isOver: boolean }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    margin: 0,
    color: isOver ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)"
}));

interface CenterProps {
    type?: string;
    onDrop: OnDropCallable;
    children: React.ReactNode;
    active?: boolean;
    highlight?: boolean;
    style?: CSSProperties;
}

const Center: React.FC<CenterProps> = ({ onDrop, children, style }) => {
    return (
        <Droppable onDrop={onDrop}>
            {({ isOver, drop }) => (
                <div
                    ref={drop}
                    style={{ width: "100%", height: "100%", ...style }}
                    data-testid={"cms-editor-first-field-area"}
                >
                    <Container isOver={isOver}>
                        <Add isOver={isOver}>{children}</Add>
                    </Container>
                </div>
            )}
        </Droppable>
    );
};

export default Center;
