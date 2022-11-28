import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element } from "~/components/Element";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-grid": any;
            "pb-grid-column": any;
        }
    }
}

const defaultStyles = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    maxWidth: "100%"
};

const Grid: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles, getThemeStyles } = usePageElements();

    const styles = [
        ...getStyles(defaultStyles),
        getThemeStyles((theme) => theme.styles.grid,
        ...getElementStyles(element)
    ];
    const PbGrid = styled(({ className, children }) => (
        <pb-grid class={className}>{children}</pb-grid>
    ))(styles);

    return (
        <PbGrid data-pe-id={element.id}>
            {element.elements.map((width, index) => (
                <Element element={element.elements[index]} />
            ))}
        </PbGrid>
    );
};

export const createGrid = () => Grid;
