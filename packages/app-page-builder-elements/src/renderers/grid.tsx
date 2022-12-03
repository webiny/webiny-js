import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element } from "~/components/Element";
import { ElementRenderer, Element as PageElement } from "~/types";
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

const PbGrid: React.FC<{ className?: string; element: PageElement }> = ({
    className,
    element,
    children
}) => (
    <pb-grid class={className} data-pe-id={element.id}>
        {children}
    </pb-grid>
);

const Grid: ElementRenderer = ({ element }) => {
    const { getStyles, getElementStyles, getThemeStyles } = usePageElements();

    const styles = [
        ...getStyles(defaultStyles),
        ...getThemeStyles(theme => theme.styles.grid),
        ...getElementStyles(element)
    ];

    const StyledPbGrid = styled(PbGrid)(styles);

    return (
        <StyledPbGrid element={element}>
            {element.elements.map(element => (
                <Element key={element.id} element={element} />
            ))}
        </StyledPbGrid>
    );
};

export const createGrid = () => Grid;
