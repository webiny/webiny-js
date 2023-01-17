import Element from "../../../components/Element";
import ElementAnimation from "../../../components/ElementAnimation";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "../../../../types";
import React from "react";
import dotProp from "dot-prop-immutable";

const getSize = (element: Pick<PbElement, "data">): number | null => {
    const size = dotProp.get(element, "data.settings.grid.size", null);
    return size === null || size === undefined ? null : Number(size);
};

interface GridPropsType {
    element: PbElement;
}
const Cell: React.FC<GridPropsType> = ({ element }) => {
    const size = getSize(element);
    if (size === null) {
        throw new Error(`Cell with id "${element.id}" does not have size defined.`);
    }
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={`webiny-pb-base-page-element-style webiny-pb-layout-grid-cell webiny-pb-layout-grid-cell-${size}`}
            >
                {element.elements.map((element, index) => (
                    <Element key={index} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Cell);
