/**
 * This file serves as a placeholder for central editor content.
 * Previously, this was done via `pb-editor-content` plugins.
 */
import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app-admin";

export const EditorContent = makeDecoratable("EditorContent", () => {
    return <EditorContentRenderer />;
});

const EditorContentRenderer = makeDecoratable("EditorContentRenderer", createVoidComponent());
