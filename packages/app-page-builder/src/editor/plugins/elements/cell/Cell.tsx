import React from "react";
import { PbEditorElement } from "~/types";
import CellContainer from "./CellContainer";

interface CellProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Cell: React.FC<CellProps> = props => {
    return <CellContainer {...props} elementId={props.element.id} />;
};

export default Cell;
