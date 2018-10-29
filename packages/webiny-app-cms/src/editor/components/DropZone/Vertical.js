//@flow
import React from "react";
import { pure } from "recompose";
import styled from "react-emotion";
import Droppable from "./../Droppable";

const InnerDiv = styled("div")({
    position: "absolute",
    width: 5,
    height: "100%",
    zIndex: 3,
    borderRadius: 5,
    display: "none"
});

const OuterDiv = pure(
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
            [InnerDiv]: {
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
                <OuterDiv isOver={isOver} last={last}>
                    <InnerDiv />
                </OuterDiv>
            )}
        </Droppable>
    );
});

export default Vertical;
