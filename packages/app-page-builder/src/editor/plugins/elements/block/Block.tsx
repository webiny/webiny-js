import React from "react";
import { PbEditorElement } from "~/types";
import PeBlock from "./PeBlock";

import { Element } from "@webiny/app-page-builder-elements/types";

interface BlockProps {
    element: PbEditorElement;
}

const Block = (props: BlockProps) => {
    const { element, ...rest } = props;
    return <PeBlock element={element as Element} {...rest} />;
};

export default Block;
