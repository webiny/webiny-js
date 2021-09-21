import Element from "~/components/Element";
import ElementAnimation from "~/components/ElementAnimation";
import { ElementRoot } from "~/components/ElementRoot";
import { PageElement } from "~/types";
import React from "react";

type GridPropsType = {
    element: PageElement;
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
