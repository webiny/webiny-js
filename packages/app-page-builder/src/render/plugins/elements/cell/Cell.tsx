import Element from "@webiny/app-page-builder/render/components/Element";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import React from "react";

type GridPropsType = {
    element: PbElement;
};
const Cell: React.FunctionComponent<GridPropsType> = ({ element }) => {
    const { size } = element.data.settings?.grid;
    if (!size) {
        throw new Error(`Cell with id "${element.id}" does not have size defined.`);
    }
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={`webiny-pb-base-page-element-style webiny-pb-layout-grid-cell webiny-pb-layout-grid-cell-${size}`}
            >
                {element.elements.map(element => (
                    <Element key={element.id} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Cell);
