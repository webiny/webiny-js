import React from "react";
import PeBlockContainer from "./PeBlockContainer";
import { PbEditorPageElementRenderParams } from "~/types";
import ElementAnimation from "~/render/components/ElementAnimation";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-block": any;
            "pb-block-outer": any;
            "pb-block-inner": any;
            "pb-block-child": any;
        }
    }
}

const defaultStyles = {
    display: "block",
    boxSizing: "border-box",
    position: "relative",
    color: "#666",
    padding: 5
};

const PbBlock: React.FC<PbEditorPageElementRenderParams> = ({ element }) => {
    const { getClassNames } = usePageElements();
    const classNames = getClassNames(defaultStyles);

    return (
        <pb-block id={element.id} class={classNames}>
            <ElementAnimation>
                <PeBlockContainer element={element} />
            </ElementAnimation>
        </pb-block>
    );
};

export default React.memo(PbBlock);
