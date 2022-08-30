import React, { useEffect, useState } from "react";
import BlockContainer from "./BlockContainer";
import ElementAnimation from "../../../../render/components/ElementAnimation";
import styled from "@emotion/styled";
import { PbEditorElement, PbElement } from "~/types";
import { ElementRoot } from "~/render/components/ElementRoot";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import RenderElement from "~/render/components/Element";

const BlockStyle = styled("div")({
    position: "relative",
    color: "#666",
    padding: 5,
    boxSizing: "border-box"
});
interface BlockType {
    element: PbEditorElement;
}
const Block: React.FC<BlockType> = ({ element }) => {
    const { id } = element;
    const { getElementTree } = useEventActionHandler();
    const [elementTree, setElementTree] = useState<PbElement | null>(null);

    useEffect(() => {
        async function getBlockElementTree() {
            if (!element) {
                return;
            }
            const tree = (await getElementTree(element)) as PbElement;
            setElementTree(tree);
        }

        getBlockElementTree();
    }, [element, setElementTree]);

    return (
        <BlockStyle id={id} style={{ position: "relative" }}>
            <ElementAnimation>
                <ElementRoot element={element}>
                    {element.data?.blockId ? (
                        <RenderElement key={element.id} element={elementTree} />
                    ) : (
                        ({ elementStyle, elementAttributes, customClasses, combineClassNames }) => (
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
                        )
                    )}
                </ElementRoot>
            </ElementAnimation>
        </BlockStyle>
    );
};

export default React.memo(Block);
