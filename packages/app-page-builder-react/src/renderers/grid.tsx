import React, { useMemo } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Element } from "~/components/Element";
import { ElementRenderer } from "~/types";

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

const Grid: ElementRenderer = ({ element }) => {
    console.log(element)
    const { getClassNames, getElementClassNames, combineClassNames } = usePageElements();
    const classNames = combineClassNames(
        getClassNames(defaultStyles),
        getElementClassNames(element)
    );

    const cellsWidths = useMemo(() => element.data.settings.grid.cellsType.split("-"), []);

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
