//@flow
import React from "react";
import styled from "@emotion/styled";
import Droppable from "../Droppable";

const InnerDiv = styled("div")({
    height: 15,
    width: "100%",
    zIndex: 3,
    borderRadius: 0,
    boxSizing: "border-box",
    display: "none",
    border: "1px dashed black",
    borderSpacing: 5
});

const BackgroundColorDiv = styled("div")({
    width: "100%",
    height: "100%"
});

const OuterDiv = styled("div")(
    {
        margin: 0,
        padding: 0,
        width: "calc(100% + 2px)",
        zIndex: 10,
        backgroundColor: "transparent",
        position: "absolute",
        display: "flex",
        justifyContent: "center"
    },
    props => ({
        [props.last ? "bottom" : "top"]: -15,
        [InnerDiv]: {
            borderColor: props.isOver ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)",
            display: props.isDragging ? "block" : "none",
            [BackgroundColorDiv]: {
                opacity: 0.5,
                backgroundColor: props.isOver
                    ? "var(--mdc-theme-primary)"
                    : "var(--mdc-theme-secondary)"
            }
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
                        zIndex: isDragging ? 1000 : -1
                    }}
                >
                    <OuterDiv isOver={isOver} isDragging={isDragging} last={last}>
                        <InnerDiv>
                            <BackgroundColorDiv />
                        </InnerDiv>
                    </OuterDiv>
                </div>
            )}
        </Droppable>
    );
};

export default Horizontal;
