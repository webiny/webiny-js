//@flow
import React from "react";
import styled from "react-emotion";
import { pure } from "recompose";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
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
                <ElementRoot element={element}>
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
                </ElementRoot>
            </ElementAnimation>
        </BlockStyle>
    );
});

export default Block;
