//@flow
import React from "react";
import { pure } from "recompose";
import styled from "react-emotion";
import Droppable from "./../Droppable";

const InnerDivVertical = styled("div")({
    position: "absolute",
    width: 5,
    height: "100%",
    zIndex: 3,
    borderRadius: 5,
    display: "none"
});

const OuterDivVertical = pure(
    styled("div")(
        {
            position: "absolute",
            width: "30%",
            top: 0,
            height: "100%",
            zIndex: 10,
            backgroundColor: "transparent"
        },
        props => ({
            [props.last ? "right" : "left"]: -2,
            textAlign: props.last ? "right" : "left",
            [InnerDivVertical]: {
                backgroundColor: props.isOver
                    ? "var(--mdc-theme-primary)"
                    : "var(--mdc-theme-secondary)",
                [props.last ? "right" : "left"]: -2,
                display: props.isOver ? "block" : "none"
            }
        })
    )
);

type Props = {
    type: string,
    onDrop: Function,
    last: boolean,
    isVisible: boolean
};

const Vertical = pure(({ last, onDrop, isVisible, type }: Props) => {
    return (
        <Droppable type={type} isVisible={isVisible} onDrop={onDrop}>
            {({ isOver }) => (
                <div
                    style={{
                        width: "30%",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        [last ? "right" : "left"]: 0,
                        zIndex: 10
                    }}
                >
                    <OuterDivVertical isOver={isOver} last={last}>
                        <InnerDivVertical />
                    </OuterDivVertical>
                </div>
            )}
        </Droppable>
    );
});

export default Vertical;
