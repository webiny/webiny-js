import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { PageAtomType, RevisionsAtomType } from "~/editor/recoil/modules";
import { PbEditorElement } from "~/types";

export type EditorProps = {
    page: PageAtomType & PbEditorElement;
    revisions: RevisionsAtomType;
};

export const Editor = makeComposable<EditorProps>("Editor", props => {
    return <EditorRenderer {...props} />;
});

export const EditorRenderer = makeComposable<EditorProps>("EditorRenderer");
