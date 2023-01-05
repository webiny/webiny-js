import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeList from "./PeList";
import PbList from "./PbList";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface ListProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const List: React.FC<ListProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbList {...props} elementId={props.element.id} />;
    }
    return <PeList element={props.element as Element} />;
};

export default React.memo(List);
