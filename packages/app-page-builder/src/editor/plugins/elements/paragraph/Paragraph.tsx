import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeParagraph from "./PeParagraph";

import { Element } from "@webiny/app-page-builder-elements/types";
import { makeComposable } from "@webiny/react-composition";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

interface ParagraphProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Paragraph = makeComposable<ParagraphProps>("Paragraph", props => {
    const { element, ...rest } = props;
    return <PeParagraph element={element as Element} {...rest} />;
});

export default Paragraph;
