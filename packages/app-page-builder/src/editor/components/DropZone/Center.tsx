import React from "react";
import Droppable, { DroppableIsVisiblePropType, DroppableOnDropPropType } from "./../Droppable";
import styled from "@emotion/styled";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";

interface ContainerProps {
    isOver: boolean;
    highlight: boolean;
    children: React.ReactNode;
}

const Container = React.memo<ContainerProps>(
    styled("div")(({ isOver }: ContainerProps) => ({
        backgroundColor: "transparent",
        boxSizing: "border-box",
        height: "100%",
        minHeight: 100,
        position: "relative",
        userSelect: "none",
        width: "100%",
        border: isOver
            ? "1px dashed var(--mdc-theme-primary)"
            : "1px dashed var(--mdc-theme-secondary)",
        ".addIcon": {
            color: isOver
                ? "var(--mdc-theme-primary) !important"
                : "var(--mdc-theme-secondary) !important"
        }
    }))
);

const Add = styled("div")({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    margin: 0
});

const isVisible: DroppableIsVisiblePropType = () => true;

export interface CenterProps {
    id: string;
    type: string;
    onDrop: DroppableOnDropPropType;
    children: React.ReactNode;
    isHighlighted: boolean;
}

const CenterComponent = ({ id, type, onDrop, children, isHighlighted }: CenterProps) => {
    const [activeElementId] = useActiveElementId();
    const isActive = activeElementId === id;

    return (
        <Droppable onDrop={onDrop} type={type} isVisible={isVisible}>
            {({ isOver, isDroppable, drop }) => (
                <div style={{ width: "100%", height: "100%" }} ref={drop}>
                    <Container
                        isOver={(isOver && isDroppable) || isActive}
                        highlight={isHighlighted}
                    >
                        <Add>{children}</Add>
                    </Container>
                </div>
            )}
        </Droppable>
    );
};

export const Center = React.memo(CenterComponent);
