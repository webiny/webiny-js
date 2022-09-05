/**
 * This file serves as a placeholder for central editor content.
 * Previously, this was done via `pb-editor-content` plugins.
 */
import React from "react";
import { makeComposable } from "@webiny/app-admin";

export const EditorContent = makeComposable("EditorContent", () => {
    return <EditorContentRenderer />;
});

const EditorContentRenderer = makeComposable("EditorContentRenderer");
