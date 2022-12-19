import React from "react";
import { PbEditorElement } from "~/types";
// import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
// import PeCell from "./PeCell";
import CellContainer from "./CellContainer";

interface CellProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Cell: React.FC<CellProps> = props => {
    // const pageElements = usePageElements();
    // if (pageElements) {
    //     return <PeCell {...props} />;
    // }

    return <CellContainer {...props} elementId={props.element.id} />;
};

export default Cell;
