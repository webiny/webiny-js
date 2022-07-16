import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { EditorProps } from "~/editor/Editor";

export { EditorProps };

export const Editor = makeComposable<EditorProps>("Editor", props => {
    return <EditorRenderer {...props} />;
});

export const EditorRenderer = makeComposable<EditorProps>("EditorRenderer");
