import React from "react";
import { PbEditorElement } from "~/types";
import PbBlock from "./PbBlock";
import PeBlock from "./PeBlock";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface BlockProps {
    element: PbEditorElement;
}

const Block: React.FC<BlockProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbBlock {...props} />;
    }

    return <PeBlock element={props.element as Element} />;
};

export default Block;
