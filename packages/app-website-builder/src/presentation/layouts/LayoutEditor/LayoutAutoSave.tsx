import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { LayoutAutoSaveFeature } from "./AutoSave/feature.js";

/**
 * Saves the open layout as it's edited (see `LayoutAutoSavePresenter`).
 */
export const LayoutAutoSave = () => {
    const editor = useDocumentEditor();
    const { presenter } = useFeature(LayoutAutoSaveFeature);

    useEffect(() => presenter.init(editor), [editor]);

    return null;
};
