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
                    {...getElementStyleProps(element)}
                    {...getElementAttributeProps(element)}
                >
                    {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => (
                        <BlockContainer
                            elementId={id}
                            elementStyle={elementStyle}
                            elementAttributes={elementAttributes}
                            customClasses={[
                                "webiny-cms-layout-block webiny-cms-base-element-style",
                                ...customClasses
                            ]}
                            combineClassNames={combineClassNames}
                        />
                    )}
                </ElementStyle>
            </ElementAnimation>
        </BlockStyle>
    );
});

export default Block;
