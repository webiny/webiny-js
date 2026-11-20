import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { LayoutGlobalComponentsFeature } from "./feature.js";

/**
 * In a layout, global components are placed like any other element: they're offered in the Insert panel
 * (until placed), and dropping one places the global itself. Their values are edited like on a page,
 * and saved on their own (see `LayoutGlobalComponentSaveBar`).
 */
export const LayoutGlobalComponents = () => {
    const editor = useDocumentEditor();
    const { presenter } = useFeature(LayoutGlobalComponentsFeature);

    useEffect(() => presenter.init(editor), [editor]);

    return null;
};
