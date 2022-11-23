import React, { useMemo } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element } from "~/components/Element";
import { ElementRenderer } from "~/types";

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
    display: "flex !important",
    flexDirection: "row !important",
    alignItems: "flex-start !important",
    "> pb-grid-column": { display: "inline-block" }
};

const Grid: ElementRenderer = ({ element }) => {
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getElementClassNames(element),
        getClassNames(defaultStyles)
    );

    const cellsWidths: number[] = useMemo(() => {
        if (!element.data.settings || !element.data.settings.grid) {
            return [];
        }
        return element.data.settings.grid.cellsType.split("-").map(Number);
    }, []);

    return (
        <pb-grid class={classNames}>
            {cellsWidths.map((width, index) => (
                <pb-grid-column key={width + index} style={{ width: `${(width / 12) * 100}%` }}>
                    <Element element={element.elements[index]} />
                </pb-grid-column>
            ))}
        </pb-grid>
    );
};

export const createGrid = () => Grid;
