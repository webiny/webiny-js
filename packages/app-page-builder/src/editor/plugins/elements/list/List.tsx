import React from "react";
import classNames from "classnames";
import { PeEditorTextElementProps } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";

import PbList from "./PbList";
import PeList from "./PeList";

export const className = classNames(
    "webiny-pb-base-page-element-style webiny-pb-page-element-text webiny-pb-typography-list"
);

export const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "unorderedlist", "orderedlist"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

const List: React.FC<PeEditorTextElementProps> = props => {
    const pageElements = usePageElements();
    if (pageElements) {
        return <PeList {...props} />;
    }
    return <PbList {...props} elementId={props.element.id} />;
};

export default React.memo(List);
