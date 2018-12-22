//@flow
import React from "react";
import styled from "react-emotion";
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
            <ElementStyle className={"webiny-cms-layout-column"} {...getElementStyleProps(element)}>
                {element.elements.map(element => (
                    <Element element={element} key={element.id} />
                ))}
            </ElementStyle>
        </ElementAnimation>
    );
};

export default Column;
