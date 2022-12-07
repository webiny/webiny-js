import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeBlock from "./PeBlock";
import PbBlock from "./PbBlock";

interface BlockProps {
    element: PbEditorElement;
}

const Block: React.FC<BlockProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeBlock {...props} />;
    }
    return <PbBlock {...props} />;
};

export default Block;
