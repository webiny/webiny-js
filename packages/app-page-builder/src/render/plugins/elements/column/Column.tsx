import React from "react";
import Element from "@webiny/app-page-builder/render/components/Element";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";

const Column = ({ element }: { element: PbElement }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-column"}
                style={{ width: (element.data.width || 100) + "%" }}
            >
                {element.elements.map(element => (
                    <Element element={element} key={element.id} />
                ))}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Column;
