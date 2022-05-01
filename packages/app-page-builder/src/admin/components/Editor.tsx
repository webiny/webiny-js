import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { PageWithContent, RevisionsAtomType } from "~/editor/recoil/modules";

export type EditorProps = {
    page: PageWithContent;
    revisions: RevisionsAtomType;
};

export const Editor = makeComposable<EditorProps>("Editor", props => {
    return <EditorRenderer {...props} />;
});

export const EditorRenderer = makeComposable<EditorProps>("EditorRenderer");
