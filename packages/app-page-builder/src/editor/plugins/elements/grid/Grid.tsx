import React from "react";
import { PbEditorElement } from "~/types";
import GridContainer from "./GridContainer";
import { isLegacyRenderingEngine } from "~/utils";
import PeGrid from "./PeGrid";

interface GridProps {
    element: PbEditorElement;
}

const Grid: React.FC<GridProps> = props => {
    if (isLegacyRenderingEngine) {
        return <GridContainer {...props} />;
    }

    return <PeGrid {...props} />;
};

export default Grid;
