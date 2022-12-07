import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { GridComponent } from "@webiny/app-page-builder-elements/renderers/grid";
import { Element } from "@webiny/app-page-builder-elements/types";

interface PeGridProps {
    element: PbEditorElement;
}

const PeGrid: React.FC<PeGridProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();

    const Grid = renderers.grid as GridComponent;

    return <Grid element={element as Element} />;
};

export default PeGrid;
