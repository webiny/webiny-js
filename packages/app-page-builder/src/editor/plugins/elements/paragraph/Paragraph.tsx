import React from "react";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { CoreOptions } from "medium-editor";
import { MediumEditorOptions, PbEditorElement } from "~/types";

import PeParagraph from "./PeParagraph";
import PbParagraph from "./PbParagraph";

export const DEFAULT_EDITOR_OPTIONS: CoreOptions = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const Heading: React.FC<{ element: PbEditorElement; mediumEditorOptions?: MediumEditorOptions }> =
    props => {
        const pageElements = usePageElements();
        if (pageElements) {
            return <PeParagraph {...props} />;
        }
        return <PbParagraph {...props} elementId={props.element.id} />;
    };

export default React.memo(Heading);
