//@flow
import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import Element from "webiny-app-cms/render/components/Element";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

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

const Row = ({ element }: ElementType) => {
    return (
        <ElementStyle
            {...getElementStyleProps(element)}
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
    );
};

export default Row;
