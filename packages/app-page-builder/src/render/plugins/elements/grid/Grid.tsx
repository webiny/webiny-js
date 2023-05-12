import Element from "../../../components/Element";
import ElementAnimation from "../../../components/ElementAnimation";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "~/types";
import React from "react";

interface GridPropsType {
    element: PbElement;
}
const Grid: React.FC<GridPropsType> = ({ element }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-grid"}
            >
                {element.elements.map((element, index) => (
                    <Element key={element.id || index} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Grid);
