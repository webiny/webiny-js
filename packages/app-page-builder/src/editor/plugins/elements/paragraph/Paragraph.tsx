import React from "react";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import PeParagraph from "./PeParagraph";
import PbParagraph from "./PbParagraph";
import { isLegacyRenderingEngine } from "~/utils";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

interface ParagraphProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Paragraph: React.FC<ParagraphProps> = props => {
    if (isLegacyRenderingEngine) {
        return <PbParagraph {...props} elementId={props.element.id} />;
    }
    return <PeParagraph {...props} />;
};

export default Paragraph;
