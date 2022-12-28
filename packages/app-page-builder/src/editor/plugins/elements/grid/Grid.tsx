import React from "react";
import { PbEditorElement } from "~/types";
import GridContainer from "./GridContainer";

interface GridProps {
    element: PbEditorElement;
}

const Grid: React.FC<GridProps> = props => {
    return <GridContainer {...props} />;
};

export default Grid;
