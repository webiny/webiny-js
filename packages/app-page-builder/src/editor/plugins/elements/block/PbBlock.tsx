import React from "react";
import styled from "@emotion/styled";
import BlockContainer from "./BlockContainer";
import { PbEditorElement } from "~/types";
import ElementAnimation from "~/render/components/ElementAnimation";
import { ElementRoot } from "~/render/components/ElementRoot";

const BlockStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});
type BlockType = {
    element: PbEditorElement;
};
const PbBlock: React.FunctionComponent<BlockType> = ({ element }) => {
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

export default React.memo(PbBlock);
