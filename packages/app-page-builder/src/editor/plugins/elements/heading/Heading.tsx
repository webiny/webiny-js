import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeHeading from "./PeHeading";
import PbHeading from "./PbHeading";

interface HeadingProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}
const Heading: React.FC<HeadingProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeHeading {...props} />;
    }
    return <PbHeading {...props} elementId={props.element.id} />;
};

export default React.memo(Heading);
