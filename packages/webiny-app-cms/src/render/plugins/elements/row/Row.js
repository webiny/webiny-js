//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
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
    display: "flex"
});

const innerElement = css({
    position: "relative",
    display: "flex",
    flex: "1 100%",
    boxSizing: "border-box",
    "&:hover": {
        ".resize-handle": {
            display: "block !important"
        }
    }
});

const Row = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ElementStyle
                {...getElementStyleProps(element)}
                {...getElementAttributeProps(element)}
                style={{ zIndex: 20, position: "relative" }}
            >
                <div className={innerElement}>
                    {element.elements.map(element =>
                        element.data ? (
                            <ColumnContainer
                                key={element.id}
                                style={{ width: (element.data.width || 100) + "%" }}
                            >
                                <Element element={element} />
                            </ColumnContainer>
                        ) : null
                    )}
                </div>
            </ElementStyle>
        </ElementAnimation>
    );
};

export default Row;
