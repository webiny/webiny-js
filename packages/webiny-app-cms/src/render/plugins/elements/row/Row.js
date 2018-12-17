//@flow
import React from "react";
import styled from "react-emotion";
import Element from "webiny-app-cms/render/components/Element";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const ColumnContainer = styled("div")({
    position: "relative",
    display: "flex"
});

const Row = ({ element }: ElementType) => {
    return (
        <ElementStyle className={"webiny-cms-layout-row"} {...getElementStyleProps(element)}>
            {element.elements.map(element =>
                element.data ? <Element key={element.id} element={element} /> : null
            )}
        </ElementStyle>
    );
};

export default Row;
