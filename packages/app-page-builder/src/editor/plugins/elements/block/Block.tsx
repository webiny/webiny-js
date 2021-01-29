import React from "react";
import BlockContainer from "./BlockContainer";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import styled from "@emotion/styled";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";

const BlockStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});
type BlockType = {
    element: PbEditorElement;
};
const Block: React.FunctionComponent<BlockType> = ({ element }) => {
    const { id } = element;

    return (
        <BlockStyle id={id} style={{ position: "relative" }}>
            <ElementAnimation>
                <ElementRoot element={element}>
                    {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => (
                        <BlockContainer
                            elementId={id}
                            elementStyle={elementStyle}
                            elementAttributes={elementAttributes}
                            customClasses={[
                                "webiny-pb-layout-block webiny-pb-base-page-element-style",
                                ...customClasses
                            ]}
                            combineClassNames={combineClassNames}
                        />
                    )}
                </ElementRoot>
            </ElementAnimation>
        </BlockStyle>
    );
};

export default React.memo(Block);
