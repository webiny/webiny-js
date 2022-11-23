import React from "react";
import {MediumEditorOptions, PbEditorElement} from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeParagraph from "./PeParagraph";
import PbParagraph from "./PbParagraph";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

interface ParagraphProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const Paragraph: React.FC<ParagraphProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeParagraph {...props} />;
    }
    return <PbParagraph {...props} elementId={props.element.id} />;
};

export default React.memo(Paragraph);
