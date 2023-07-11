import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeHeading from "./PeHeading";

import { Element } from "@webiny/app-page-builder-elements/types";
import { makeComposable } from "@webiny/react-composition";

interface HeadingProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Heading = makeComposable<HeadingProps>("Heading", props => {
    const { element, ...rest } = props;
    return <PeHeading element={element as Element} {...rest} />;
});

export default Heading;
