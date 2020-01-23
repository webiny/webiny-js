import * as React from "react";
import styled from "@emotion/styled";
import Droppable from "./../Droppable";
import { DragObjectWithType } from "react-dnd";

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
    opacity: isOver ? 1 : 0.6
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

type Props = {
    type?: string;
    onDrop(item: DragObjectWithType): void;
    children: React.ReactNode;
    active?: boolean;
    highlight?: boolean;
};

export default function Center({ onDrop, children }: Props) {
    return (
        <Droppable onDrop={onDrop}>
            {({ isOver, drop }) => (
                <div ref={drop} style={{ width: "100%", height: "100%" }}>
                    <Container isOver={isOver}>
                        <Add isOver={isOver}>{children}</Add>
                    </Container>
                </div>
            )}
        </Droppable>
    );
}
