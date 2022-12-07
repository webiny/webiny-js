import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeGrid from "./PeGrid";
import GridContainer from "./GridContainer";

interface GridProps {
    element: PbEditorElement;
}

const Grid: React.FC<GridProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeGrid {...props} />;
    }
    return <GridContainer {...props} />;
};

export default Grid;
