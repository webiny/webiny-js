import React from "react";
import styled from "@emotion/styled";
import { Droppable, IsVisibleCallable } from "../Droppable";
import { DragSource } from "~/types";

const InnerDivVertical = styled("div")({
    position: "absolute",
    width: 10,
    height: "100%",
    zIndex: 3,
    borderRadius: 0,
    display: "none",
    boxSizing: "border-box",
    border: "1px dashed black",
    borderSpacing: 5
});

const BackgroundColorDiv = styled("div")({
    width: "100%",
    height: "100%"
});

interface OuterDivVerticalProps {
    isOver: boolean;
    last?: boolean;
    isVisible?: IsVisibleCallable;
    isDragging?: boolean;
}

const OuterDivVertical = styled("div")(
    {
        position: "absolute",
        width: "30%",
        top: 0,
        height: "100%",
        zIndex: 10,
        backgroundColor: "transparent"
    },
    (props: OuterDivVerticalProps) => ({
        [props.last ? "right" : "left"]: -9,
        textAlign: props.last ? "right" : "left",
        // @ts-expect-error
        [InnerDivVertical]: {
            borderColor: props.isOver ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)",
            [props.last ? "right" : "left"]: -2,
            display: props.isDragging ? "block" : "none",
            // @ts-expect-error
            [BackgroundColorDiv]: {
                opacity: 0.5,
                backgroundColor: props.isOver
                    ? "var(--mdc-theme-primary)"
                    : "var(--mdc-theme-secondary)"
            }
        }
    })
);

interface VerticalProps {
    depth?: number;
    onDrop(item: DragSource): void;
    last?: boolean;
    isVisible?: any;
}

const Vertical = ({ depth, last, onDrop, isVisible }: VerticalProps) => {
    return (
        <Droppable onDrop={onDrop} isVisible={isVisible}>
            {({ isOver, isDragging, drop }) => (
                <div
                    ref={drop}
                    style={{
                        /* For dropzone debugging: border: "1px solid blue",*/
                        width: "30%",
                        maxWidth: "100px",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        [last ? "right" : "left"]: 0,
                        zIndex: isDragging ? 1000 + (depth || 0) : -1
                    }}
                >
                    <OuterDivVertical isOver={isOver} isDragging={isDragging} last={last}>
                        <InnerDivVertical>
                            <BackgroundColorDiv />
                        </InnerDivVertical>
                    </OuterDivVertical>
                </div>
            )}
        </Droppable>
    );
};

export default Vertical;
