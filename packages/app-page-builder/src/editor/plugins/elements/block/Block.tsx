import React from "react";
import { PbEditorElement } from "~/types";
import PbBlock from "./PbBlock";
import PeBlock from "./PeBlock";
import { isLegacyRenderingEngine } from "~/utils";

interface BlockProps {
    element: PbEditorElement;
}

const Block: React.FC<BlockProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbBlock {...props} />;
    }

    return <PeBlock {...props} />;
};

export default Block;
