import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { PageGlobalComponentsFeature } from "./feature.js";

/**
 * The page is delivered with its stored global components. Tracks them for the open page, so a global
 * defined in code shows up right away, and its changes can be saved or discarded.
 */
export const GlobalComponentsLoader = () => {
    const editor = useDocumentEditor<EditorPage>();
    const { presenter } = useFeature(PageGlobalComponentsFeature);

    useEffect(() => presenter.init(editor), [editor]);

    return null;
};
