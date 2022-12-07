import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { CellComponent } from "@webiny/app-page-builder-elements/renderers/cell";
import { Element } from "@webiny/app-page-builder-elements/types";

interface PeCellProps {
    element: PbEditorElement;
}

const PeCell: React.FC<PeCellProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();

    const Cell = renderers.cell as CellComponent;

    return <Cell element={element as Element} />;
};

export default PeCell;
