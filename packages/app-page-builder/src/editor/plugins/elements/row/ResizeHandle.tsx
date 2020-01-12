import React from "react";
import styled, { Interpolation } from "@emotion/styled";

const Handle = React.memo(
    styled("div")(
        ({ isResizing }: any): Interpolation => ({
            position: "absolute",
            left: -5,
            top: "10%",
            height: "80%",
            minHeight: 25,
            translate: "width 0.5s",
            zIndex: 30,
            width: 10,
            borderRadius: 10,
            cursor: "col-resize",
            backgroundColor: isResizing
                ? "var(--mdc-theme-primary)"
                : "var(--mdc-theme-secondary)",
            display: "none",
            transition: "background-color 0.5s, opacity 0.2s",
            opacity: 0.2,
            "&:hover": {
                opacity: 1
            }
        })
    )
);

type RatioContainerProps = { children: any[] };

const RatioContainer: React.FC<RatioContainerProps> = React.memo(
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

type RatioProps = { left: number; right: number };

const Ratio = React.memo(({ left, right }: RatioProps) => {
    return (
        <RatioContainer>
            {left.toFixed(1)}
            <small>%</small> / {right.toFixed(1)}
            <small>%</small>
        </RatioContainer>
    );
});

Ratio.displayName = "Ratio";

const ResizeHandle = ({ leftWidth, rightWidth, ...props }) => {
    return (
        <React.Fragment>
            <Handle className={"resize-handle"} {...props} />
            {props.isResizing && <Ratio left={leftWidth} right={rightWidth} />}
        </React.Fragment>
    );
};

export default React.memo(ResizeHandle);
