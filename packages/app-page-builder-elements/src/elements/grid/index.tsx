import Element from "~/components/Element";
import ElementAnimation from "~/components/ElementAnimation";
import { ElementRoot } from "~/components/ElementRoot";
import { PageElement } from "~/types";
import React from "react";

type GridPropsType = {
    element: PageElement;
};
const Grid: React.FunctionComponent<GridPropsType> = ({ element }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-grid"}
            >
                {element.elements.map(element => (
                    <Element key={element.id} element={element} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default React.memo(Grid);
