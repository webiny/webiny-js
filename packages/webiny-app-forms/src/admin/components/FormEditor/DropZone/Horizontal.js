//@flow
import React from "react";
import styled from "react-emotion";
import Droppable from "../Droppable";

const InnerDiv = styled("div")({
    height: 5,
    width: "100%",
    zIndex: 3,
    borderRadius: 5,
    boxSizing: "border-box",
    display: "none"
});

const OuterDiv = styled("div")(
    {
        margin: 0,
        padding: 0,
        width: "100%",
        zIndex: 10,
        backgroundColor: "transparent",
        position: "absolute",
        display: "flex",
        justifyContent: "center"
    },
    props => ({
        [props.last ? "bottom" : "top"]: 0,
        [InnerDiv]: {
            backgroundColor: props.isOver
                ? "var(--mdc-theme-primary)"
                : "var(--mdc-theme-secondary)",
            display: props.isDragging ? "block" : "none"
        }
    })
);

type Props = {
    onDrop: Function,
    last?: boolean,
    isVisible?: Function
};

const Horizontal = ({ last, onDrop, isVisible }: Props) => {
    return (
        <Droppable onDrop={onDrop} isVisible={isVisible}>
            {({ isOver, isDragging }) => (
                <div
                    style={{
                        height: "25px",
                        width: "100%",
                        position: "absolute",
                        [last ? "bottom" : "top"]: 0,
                        left: 0,
                        zIndex: 1000
                    }}
                >
                    <OuterDiv isOver={isOver} isDragging={isDragging} last={last}>
                        <InnerDiv />
                    </OuterDiv>
                </div>
            )}
        </Droppable>
    );
};

export default Horizontal;
