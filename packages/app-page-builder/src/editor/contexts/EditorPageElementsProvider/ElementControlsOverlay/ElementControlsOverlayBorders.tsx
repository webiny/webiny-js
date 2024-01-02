import React from "react";
import styled from "@emotion/styled";
import { CSSObject } from "@emotion/react";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-eco-border": React.HTMLProps<HTMLDivElement>;
        }
    }
}

interface PbElementControlsOverlayBorderProps {
    className?: string;
    placement: "top" | "right" | "bottom" | "left";
    color: string;
    zIndex: number;
}

const ElementControlsOverlayBorder = styled((props: PbElementControlsOverlayBorderProps) => {
    // @ts-expect-error Not supported by `React.HTMLProps<HTMLDivElement>`.
    return <pb-eco-border data-type={props.type} class={props.className} />;
})((props: PbElementControlsOverlayBorderProps) => {
    const { placement, zIndex, color } = props;
    const horizontal = placement === "top" || placement === "bottom";

    const styles: CSSObject = {
        position: "absolute",
        backgroundColor: color,
        height: horizontal ? 2 : "100%",
        width: horizontal ? "100%" : 2,
        top: placement !== "bottom" ? 0 : undefined,
        bottom: placement === "bottom" ? 0 : undefined,
        left: placement !== "right" ? 0 : undefined,
        right: placement === "right" ? 0 : undefined,
        zIndex: zIndex + 10,
        transition: "background 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)"
    };

    return styles;
});

interface Props {
    color: string;
    zIndex: number;
}

export const ElementControlsOverlayBorders = (props: Props) => {
    return (
        <>
            <ElementControlsOverlayBorder placement={"top"} {...props} />
            <ElementControlsOverlayBorder placement={"right"} {...props} />
            <ElementControlsOverlayBorder placement={"bottom"} {...props} />
            <ElementControlsOverlayBorder placement={"left"} {...props} />
        </>
    );
};
