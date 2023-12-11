import React from "react";
import { PbEditorElement } from "~/types";

import PeCell from "~/editor/plugins/elements/cell/PeCell";
import { Element } from "@webiny/app-page-builder-elements/types";

interface CellProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Cell = (props: CellProps) => {
    const { element, ...rest } = props;
    return <PeCell element={element as Element} {...rest} />;
};

export default Cell;
