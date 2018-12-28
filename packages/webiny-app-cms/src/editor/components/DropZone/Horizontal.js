//@flow
import React from "react";
import Droppable from "webiny-app-cms/editor/components/Droppable";
import styled from "react-emotion";
import { pure } from "recompose";

const InnerDiv = styled("div")({
    height: 5,
    width: "calc(100% - 50px)",
    zIndex: 3,
    borderRadius: 5,
    boxSizing: "border-box",
    display: "none"
});

const OuterDiv = pure(
    styled("div")(
        {
            height: 20,
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
            alignItems: props.below ? "flex-end" : "flex-start",
            //[props.below ? "bottom" : "top"]: 0,
            [InnerDiv]: {
                backgroundColor: props.isOver
                    ? "var(--mdc-theme-primary)"
                    : "var(--mdc-theme-secondary)",
                display: props.isOver ? "block" : "none"
            }
        })
    )
);

type Props = {
    type: string,
    onDrop: Function,
    below: boolean,
    isVisible: boolean
};

const Horizontal = pure(({ below, onDrop, isVisible, type }: Props) => {
    return (
        <Droppable type={type} isVisible={isVisible} onDrop={onDrop}>
            {({ isOver }) => (
                <OuterDiv isOver={isOver} below={below}>
                    <InnerDiv />
                </OuterDiv>
            )}
        </Droppable>
    );
});

export default Horizontal;
