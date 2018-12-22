//@flow
import React from "react";
import Element from "webiny-app-cms/render/components/Element";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

const Row = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ElementStyle
                className={"webiny-cms-layout-row"}
                {...getElementAttributeProps(element)}
                {...getElementStyleProps(element)}
            >
                {element.elements.map(element =>
                    element.data ? <Element key={element.id} element={element} /> : null
                )}
            </ElementStyle>
        </ElementAnimation>
    );
};

export default Row;
