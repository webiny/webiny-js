//@flow
import React from "react";
import styled from "react-emotion";
import { pure } from "recompose";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import BlockContainer from "./BlockContainer";

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
            <ElementStyle
                style={{ margin: "0 auto", boxSizing: "border-box", flexDirection: "column" }}
                {...getElementStyleProps(element)}
            >
                {({ elementStyle, customClasses, combineClassNames }) => (
                    <BlockContainer
                        elementId={id}
                        elementStyle={elementStyle}
                        customClasses={customClasses}
                        combineClassNames={combineClassNames}
                    />
                )}
            </ElementStyle>
        </BlockStyle>
    );
});

export default Block;
