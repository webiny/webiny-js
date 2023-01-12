import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeHeading from "./PeHeading";
import PbHeading from "./PbHeading";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface HeadingProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Heading: React.FC<HeadingProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbHeading {...props} elementId={props.element.id} />;
    }

    const { element, ...rest } = props;
    return <PeHeading element={element as Element} {...rest} />;
};

export default Heading;
