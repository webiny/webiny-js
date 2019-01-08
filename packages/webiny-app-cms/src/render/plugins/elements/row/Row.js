//@flow
import React from "react";
import Element from "webiny-app-cms/render/components/Element";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import type { ElementType } from "webiny-app-cms/types";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

const Row = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-cms-base-element-style webiny-cms-layout-row"}
            >
                {element.elements.map(element =>
                    /* $FlowFixMe */
                    element.data ? <Element key={element.id} element={element} /> : null
                )}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Row;
