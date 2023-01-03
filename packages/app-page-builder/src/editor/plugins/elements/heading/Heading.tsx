import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeHeading from "./PeHeading";
import PbHeading from "./PbHeading";
import { isLegacyRenderingEngine } from "~/utils";

interface HeadingProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Heading: React.FC<HeadingProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbHeading {...props} elementId={props.element.id} />;
    }
    return <PeHeading {...props} />;
};

export default Heading;
