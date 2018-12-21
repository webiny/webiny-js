//@flow
import React from "react";
import styled from "react-emotion";
import { pure } from "recompose";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";
import BlockContainer from "./BlockContainer";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

const BlockStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});

const Block = pure(({ element }) => {
    const { id } = element;

    return (
        <BlockStyle id={id} style={{ zIndex: 20, position: "relative" }}>
            <ElementAnimation>
                <ElementStyle
                    style={{ margin: "0 auto", boxSizing: "border-box" }}
                    {...getElementStyleProps(element)}
                    {...getElementAttributeProps(element)}
                >
                    {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => (
                        <BlockContainer
                            elementId={id}
                            elementStyle={elementStyle}
                            elementAttributes={elementAttributes}
                            customClasses={customClasses}
                            combineClassNames={combineClassNames}
                        />
                    )}
                </ElementStyle>
            </ElementAnimation>
        </BlockStyle>
    );
});

export default Block;
