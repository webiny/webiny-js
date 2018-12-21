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

const ColumnContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%"
});

const Column = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ColumnContainer>
                <ElementStyle
                    {...getElementStyleProps(element)}
                    {...getElementAttributeProps(element)}
                    style={{ height: "100%" }}
                >
                    {element.elements.map(element => (
                        <Element element={element} key={element.id} />
                    ))}
                </ElementStyle>
            </ColumnContainer>
        </ElementAnimation>
    );
};

export default Column;
