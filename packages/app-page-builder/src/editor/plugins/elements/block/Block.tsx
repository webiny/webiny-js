import React from "react";
import { PbEditorElement } from "~/types";
import PbBlock from "./PbBlock";

interface BlockProps {
    element: PbEditorElement;
}

const Block: React.FC<BlockProps> = props => {
    return <PbBlock {...props} />;
};

export default Block;
