//@flow
import React from "react";
import styled from "react-emotion";
import Droppable from "../Droppable";

const InnerDivVertical = styled("div")({
    position: "absolute",
    width: 5,
    height: "100%",
    zIndex: 3,
    borderRadius: 5,
    display: "none"
});

const OuterDivVertical = styled("div")(
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
            display: props.isDragging ? "block" : "none"
        }
    })
);

type Props = {
    onDrop: Function,
    last?: boolean,
    isVisible: Function
};

const Vertical = ({ last, onDrop, isVisible }: Props) => {
    return (
        <Droppable onDrop={onDrop} isVisible={isVisible}>
            {({ isOver, isDragging }) => (
                <div
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
                    <OuterDivVertical isOver={isOver} isDragging={isDragging} last={last}>
                        <InnerDivVertical />
                    </OuterDivVertical>
                </div>
            )}
        </Droppable>
    );
};

export default Vertical;
