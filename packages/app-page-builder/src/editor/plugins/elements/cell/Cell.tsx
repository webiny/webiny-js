import React from "react";
import { PbEditorElement } from "~/types";
import CellContainer from "./CellContainer";
import { isLegacyRenderingEngine } from "~/utils";
import PeCell from "~/editor/plugins/elements/cell/PeCell";

interface CellProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Cell: React.FC<CellProps> = props => {
    if (isLegacyRenderingEngine) {
        return <CellContainer {...props} elementId={props.element.id} />;
    }

    return <PeCell {...props} />;
};

export default Cell;
