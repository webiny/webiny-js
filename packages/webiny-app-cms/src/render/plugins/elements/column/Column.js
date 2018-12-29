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

const Column = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ElementStyle
                className={"webiny-cms-base-element-style webiny-cms-layout-column"}
                {...getElementAttributeProps(element)}
                {...getElementStyleProps(element)}
                style={{ width: (element.data.width || 100) + "%" }}
            >
                {element.elements.map(element => (
                    <Element element={element} key={element.id} />
                ))}
            </ElementStyle>
        </ElementAnimation>
    );
};

export default Column;
