import React from "react";
import { RecoilRootProps } from "recoil";
import { makeComposable } from "@webiny/app-admin";

export type EditorProps = {
    initializeState: RecoilRootProps["initializeState"];
};

export const Editor = makeComposable<EditorProps>("Editor", props => {
    return <EditorRenderer {...props} />;
});

export const EditorRenderer = makeComposable<EditorProps>("EditorRenderer");
