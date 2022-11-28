import React from "react";
import { Elements } from "~/components/Elements";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-block": any;
            "pb-block-inner": any;
        }
    }
}

const defaultStyles = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    boxSizing: "border-box"
};

const Block: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles } = usePageElements();

    const styles = [...getStyles(defaultStyles), ...getElementStyles(element)];
    const PbBlockInner = styled(({ className, children }) => (
        <pb-block-inner class={className}>{children}</pb-block-inner>
    ))(styles);

    return (
        <pb-block data-pe-id={element.id}>
            <PbBlockInner>
                <Elements element={element} />
            </PbBlockInner>
        </pb-block>
    );
};

export const createBlock = () => Block;
