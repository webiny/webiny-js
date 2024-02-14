import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Element } from "@webiny/app-page-builder-elements/types";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeHeading from "./PeHeading";

interface HeadingProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Heading = makeDecoratable("Heading", (props: HeadingProps) => {
    const { element, ...rest } = props;
    return <PeHeading element={element as Element} {...rest} />;
});

export default Heading;
