import React from "react";
import classNames from "classnames";
import { PeEditorTextElementProps } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import PeQuote from "./PeQuote";
import PbQuote from "./PbQuote";

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text"
);

export const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "quote"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const Quote: React.FC<PeEditorTextElementProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeQuote {...props} />;
    }

    return <PbQuote elementId={props.element.id} mediumEditorOptions={props.mediumEditorOptions} />;
};
export default React.memo(Quote);
