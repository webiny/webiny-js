//@flow
import * as React from "react";
import styled from "@emotion/styled";
import { getElementProps } from "@webiny/app-page-builder/editor/selectors";
import { connect } from "@webiny/app-page-builder/editor/redux";
import Droppable from "./../Droppable";

const Container = React.memo(
    styled("div")(({ isOver }) => ({
        backgroundColor: "transparent",
        boxSizing: "border-box",
        height: "100%",
        minHeight: 100,
        position: "relative",
        userSelect: "none",
        width: "100%",
        border: isOver
            ? "1px dashed var(--mdc-theme-primary)"
            : "1px dashed var(--mdc-theme-secondary)",
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

const Center = React.memo(({ type, onDrop, children, active, highlight }: Props) => {
    return (
        <Droppable onDrop={onDrop} type={type} isVisible={isVisible}>
            {({ isOver, isDroppable, drop }) => (
                <div style={{ width: "100%", height: "100%" }} ref={drop}>
                    <Container isOver={(isOver && isDroppable) || active} highlight={highlight}>
                        <Add>{children}</Add>
                    </Container>
                </div>
            )}
        </Droppable>
    );
});

export default connect((state, props) => {
    return getElementProps(state, props);
})(Center);
