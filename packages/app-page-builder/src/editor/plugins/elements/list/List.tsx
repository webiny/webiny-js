import React from "react";
import {MediumEditorOptions, PbEditorElement} from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeList from "./PeList";
import PbList from "./PbList";

interface ListProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const List: React.FC<ListProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeList {...props} />;
    }
    return <PbList {...props} elementId={props.element.id} />;
};

export default React.memo(List);
