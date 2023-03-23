import * as React from "react";
import styled from "@emotion/styled";
import { Droppable, OnDropCallable } from "./../Droppable";

interface ContainerProps {
    isOver: boolean;
}
const Container = styled("div")(({ isOver }: ContainerProps) => ({
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

interface AddProps {
    isOver: boolean;
}
const Add = styled("div")(({ isOver }: AddProps) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    margin: 0,
    color: isOver ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)"
}));

export interface CenterProps {
    type?: string;
    onDrop: OnDropCallable;
    children: React.ReactNode;
    active?: boolean;
    highlight?: boolean;
}

export const Center: React.VFC<CenterProps> = ({ onDrop, children }) => {
    return (
        <Droppable onDrop={onDrop}>
            {({ isOver, drop }) => (
                <div
                    ref={drop}
                    style={{ width: "100%", height: "100%" }}
                    data-testid={"fb.editor.dropzone.center"}
                >
                    <Container isOver={isOver}>
                        <Add isOver={isOver}>{children}</Add>
                    </Container>
                </div>
            )}
        </Droppable>
    );
};
