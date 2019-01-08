//@flow
import React from "react";
import styled from "react-emotion";
import { pure } from "recompose";

const Handle = pure(
    styled("div")(({ isResizing }) => ({
        position: "absolute",
        left: -5,
        top: "10%",
        height: "80%",
        minHeight: 25,
        translate: "width 0.5s",
        zIndex: 3,
        width: 10,
        borderRadius: 10,
        cursor: "col-resize",
        backgroundColor: isResizing ? "var(--mdc-theme-primary)" : "var(--mdc-theme-secondary)",
        display: "none",
        transition: "background-color 0.5s"
    }))
);

const RatioContainer = pure(
    styled("div")({
        position: "absolute",
        top: -12,
        transform: "translateX(-50%)",
        color: "#fff",
        fontSize: 12,
        backgroundColor: "var(--mdc-theme-secondary)",
        padding: 5,
        borderRadius: 5,
        zIndex: 10
    })
);

const Ratio = pure(({ left, right }) => {
    return (
        <RatioContainer>
            {left.toFixed(1)}
            <small>%</small> / {right.toFixed(1)}
            <small>%</small>
        </RatioContainer>
    );
});

const ResizeHandle = pure(({ leftWidth, rightWidth, ...props }) => {
    return (
        <React.Fragment>
            <Handle className={"resize-handle"} {...props} />
            {props.isResizing && <Ratio left={leftWidth} right={rightWidth} />}
        </React.Fragment>
    );
});

export default ResizeHandle;
