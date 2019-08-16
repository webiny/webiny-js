//@flow
import React from "react";
import Element from "webiny-app-cms/render/components/Element";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import type { ElementType } from "webiny-app-cms/types";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

const Column = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-column"}
                style={{ width: (element.data.width || 100) + "%" }}
            >
                {element.elements.map(element => (
                    /* $FlowFixMe */
                    <Element element={element} key={element.id} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Column;
