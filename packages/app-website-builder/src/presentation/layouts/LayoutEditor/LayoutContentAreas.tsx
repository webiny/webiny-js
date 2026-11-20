import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { LayoutEditorFeature } from "./feature.js";

/**
 * Names Named content inserted into the open layout (see `LayoutEditorPresenter.nameContentAreas`).
 */
export const LayoutContentAreas = () => {
    const editor = useDocumentEditor();
    const { presenter } = useFeature(LayoutEditorFeature);

    useEffect(() => presenter.nameContentAreas(editor), [editor]);

    return null;
};
