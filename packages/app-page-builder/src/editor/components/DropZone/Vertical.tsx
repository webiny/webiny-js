import React from "react";
import Droppable, { DroppableIsVisiblePropType, DroppableOnDropPropType } from "./../Droppable";
import styled from "@emotion/styled";

const InnerDivVertical = styled("div")({
    position: "absolute",
    width: 5,
    height: "100%",
    zIndex: 3,
    borderRadius: 5,
    display: "none"
});

interface OuterDivVerticalProps {
    isOver: boolean;
    last: boolean;
    children: React.ReactNode;
}

const OuterDivVertical = React.memo<OuterDivVerticalProps>(
    styled("div")(
        {
            position: "absolute",
            width: "30%",
            top: 0,
            height: "100%",
            zIndex: 10,
            backgroundColor: "transparent"
        },
        (props: OuterDivVerticalProps) => ({
            [props.last ? "right" : "left"]: -2,
            textAlign: props.last ? "right" : "left",
            [InnerDivVertical as unknown as string]: {
                backgroundColor: props.isOver
                    ? "var(--mdc-theme-primary)"
                    : "var(--mdc-theme-secondary)",
                [props.last ? "right" : "left"]: -2,
                display: props.isOver ? "block" : "none"
            }
        })
    )
);

export interface VerticalPropsType {
    type: string;
    onDrop: DroppableOnDropPropType;
    last?: boolean;
    isVisible?: DroppableIsVisiblePropType;
}

const VerticalComponent = ({ last, onDrop, isVisible, type }: VerticalPropsType) => {
    return (
        <Droppable type={type} isVisible={isVisible} onDrop={onDrop}>
            {({ isOver, drop }) => (
                <div
                    ref={drop}
                    style={{
                        width: "30%",
                        maxWidth: "100px",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        [last ? "right" : "left"]: 0,
                        zIndex: 1000
                    }}
                >
                    <OuterDivVertical isOver={isOver} last={last || false}>
                        <InnerDivVertical />
                    </OuterDivVertical>
                </div>
            )}
        </Droppable>
    );
};

export const Vertical = React.memo(VerticalComponent);
