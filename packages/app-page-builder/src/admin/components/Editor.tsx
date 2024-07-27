import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app-admin";
import { EditorProps } from "~/editor/Editor";

export type { EditorProps };

export const Editor = makeDecoratable("Editor", (props: EditorProps) => {
    return <EditorRenderer {...props} />;
});

export const EditorRenderer = makeDecoratable("EditorRenderer", createVoidComponent<EditorProps>());
