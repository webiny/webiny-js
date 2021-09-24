import React, { useMemo } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element } from "~/components/Element";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-grid": any;
            "pb-grid-column": any;
        }
    }
}

const defaultStyles = { display: "block" };

const Grid: ElementComponent = ({ element }) => {
    const cellsWidths = useMemo(() => element.data.settings.grid.cellsType.split("-"), []);
    const { getStyles } = usePageElements();

    return (
        <pb-grid class={getStyles({ element, styles: defaultStyles })}>
            {cellsWidths.map((width, index) => (
                <pb-grid-column key={width + index} style={{ width: `${(width / 12) * 100}%` }}>
                    <Element element={element.elements[index]} />
                </pb-grid-column>
            ))}
        </pb-grid>
    );
};

export const createGrid = () => Grid;
