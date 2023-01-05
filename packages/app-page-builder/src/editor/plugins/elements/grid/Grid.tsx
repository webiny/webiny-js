import React from "react";
import { PbEditorElement } from "~/types";
import GridContainer from "./GridContainer";
import { isLegacyRenderingEngine } from "~/utils";
import PeGrid from "./PeGrid";
import { Element } from "@webiny/app-page-builder-elements/types";

interface GridProps {
    element: PbEditorElement;
}

const Grid: React.FC<GridProps> = props => {
    if (isLegacyRenderingEngine) {
        return <GridContainer {...props} />;
    }

    const { element, ...rest } = props;
    return <PeGrid element={props.element as Element} {...rest} />;
};

export default Grid;
