//@flow
import * as React from "react";
import styled from "react-emotion";
import { getElementProps } from "webiny-app-cms/editor/selectors";
import { connect } from "react-redux";
import { pure } from "recompose";
import Droppable from "./../Droppable";

const Container = pure(
    styled("div")(({ isOver }) => ({
        backgroundColor: "transparent",
        boxSizing: "border-box",
        height: "100%",
        minHeight: 100,
        position: "relative",
        userSelect: "none",
        width: "100%",
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

const isVisible = () => true;

type Props = {
    type: string,
    onDrop: Function,
    children: React.Node,
    active: boolean,
    highlight: boolean
};

const Center = pure(({ type, onDrop, children, active, highlight }: Props) => {
    return (
        <Droppable onDrop={onDrop} type={type} isVisible={isVisible}>
            {({ isOver, isDroppable }) => (
                <Container isOver={(isOver && isDroppable) || active} highlight={highlight}>
                    <Add>{children}</Add>
                </Container>
            )}
        </Droppable>
    );
});

export default connect((state, props) => {
    return getElementProps(state, props);
})(Center);
