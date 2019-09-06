//@flow
import * as React from "react";
import styled from "@emotion/styled";
import Droppable from "./../Droppable";

const Container = styled("div")(({ isOver }) => ({
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

const Add = styled("div")(({ isOver }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    margin: 0,
    color: isOver ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)"
}));

type Props = {
    onDrop: Function,
    children: React.Node
};

export default function Center({ onDrop, children }: Props) {
    return (
        <Droppable onDrop={onDrop} ref={drop}>
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
