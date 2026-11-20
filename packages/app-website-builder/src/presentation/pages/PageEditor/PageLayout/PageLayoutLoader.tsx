import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { PageLayoutFeature } from "./feature.js";

/**
 * The page is delivered with its layout. When another layout is picked in the page settings, load it,
 * so the preview renders the page in it right away.
 */
export const PageLayoutLoader = () => {
    const editor = useDocumentEditor<EditorPage>();
    const { presenter } = useFeature(PageLayoutFeature);

    useEffect(() => presenter.init(editor), [editor]);

    return null;
};
