import React from "react";
import { PbEditorElement } from "~/types";
import CellContainer from "./CellContainer";
import { isLegacyRenderingEngine } from "~/utils";
import PeCell from "~/editor/plugins/elements/cell/PeCell";
import { Element } from "@webiny/app-page-builder-elements/types";

interface CellProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Cell: React.FC<CellProps> = props => {
    if (isLegacyRenderingEngine) {
        return <CellContainer {...props} elementId={props.element.id} />;
    }

    const { element, ...rest } = props;
    return <PeCell element={props.element as Element} {...rest} />;
};

export default Cell;
