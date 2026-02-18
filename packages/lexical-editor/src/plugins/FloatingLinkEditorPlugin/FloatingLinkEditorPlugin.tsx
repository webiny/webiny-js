import React from "react";
import { FloatingLinkEditorController } from "./FloatingLinkEditorController.js";
import type { LinkEditForm } from "./LinkEditForm.js";
import type { LinkPreviewForm } from "./LinkPreviewForm.js";
import "./FloatingLinkEditorPlugin.css";

export function FloatingLinkEditorPlugin({
    anchorElem,
    ...props
}: {
    anchorElem?: () => HTMLElement;
    LinkEditForm?: typeof LinkEditForm;
    LinkPreviewForm?: typeof LinkPreviewForm;
}): JSX.Element | null {
    return (
        <FloatingLinkEditorController
            anchorElem={anchorElem}
            LinkEditForm={props.LinkEditForm}
            LinkPreviewForm={props.LinkPreviewForm}
        />
    );
}
