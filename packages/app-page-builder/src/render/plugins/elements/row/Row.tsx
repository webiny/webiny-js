import React from "react";
import Element from "@webiny/app-page-builder/render/components/Element";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";

const Row = ({ element }: { element: PbElement }) => {
    return (
        <ElementAnimation>
            <ElementRoot
                element={element}
                className={"webiny-pb-base-page-element-style webiny-pb-layout-row"}
            >
                {element.elements.map(element =>
                    element.data ? <Element key={element.id} element={element} /> : null
                )}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Row;
