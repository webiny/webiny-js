import React from "react";
import styled from "@emotion/styled";
import { Droppable, IsVisibleCallable, OnDropCallable } from "../Droppable";

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
    isVisible?: boolean;
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

export interface VerticalProps {
    onDrop: OnDropCallable;
    last?: boolean;
    isVisible?: IsVisibleCallable;
}

export const Vertical = ({ last, onDrop, isVisible }: VerticalProps) => {
    return (
        <Droppable onDrop={onDrop} isVisible={isVisible}>
            {({ isOver, isDragging, drop }) => (
                <div
                    ref={drop}
                    style={{
                        width: "30%",
                        maxWidth: "100px",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        [last ? "right" : "left"]: 0,
                        zIndex: isDragging ? 1000 : -1
                    }}
                >
                    <OuterDivVertical isOver={isOver} isDragging={isDragging} last={!!last}>
                        <InnerDivVertical>
                            <BackgroundColorDiv />
                        </InnerDivVertical>
                    </OuterDivVertical>
                </div>
            )}
        </Droppable>
    );
};
