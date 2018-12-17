//@flow
import React from "react";
import styled from "react-emotion";
import Element from "webiny-app-cms/render/components/Element";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const Column = ({ element }: ElementType) => {
    return (
        <ElementStyle className={"webiny-cms-layout-column"} {...getElementStyleProps(element)}>
            {element.elements.map(element => (
                <Element element={element} key={element.id} />
            ))}
        </ElementStyle>
    );
};

export default Column;
