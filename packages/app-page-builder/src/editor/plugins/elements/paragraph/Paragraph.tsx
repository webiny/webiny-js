import React from "react";
import { Element } from "@webiny/app-page-builder-elements/types";
import { makeDecoratable } from "@webiny/app-admin";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeParagraph from "./PeParagraph";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

interface ParagraphProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Paragraph = makeDecoratable("Paragraph", (props: ParagraphProps) => {
    const { element, ...rest } = props;
    return <PeParagraph element={element as Element} {...rest} />;
});

export default Paragraph;
