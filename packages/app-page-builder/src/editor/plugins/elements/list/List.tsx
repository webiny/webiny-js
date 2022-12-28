import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeList from "./PeList";
import PbList from "./PbList";
import { isLegacyRenderingEngine } from "~/utils";

interface ListProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const List: React.FC<ListProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbList {...props} elementId={props.element.id} />;
    }
    return <PeList {...props} />;
};

export default React.memo(List);
