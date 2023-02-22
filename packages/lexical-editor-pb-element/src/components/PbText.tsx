import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { CoreOptions } from "medium-editor";
import { LexicalText } from "~/components/LexicalText";

interface TextElementProps {
    elementId: string;
    mediumEditorOptions?: CoreOptions;
    tag?: string | [string, Record<string, any>];
}

export const PbText = makeComposable<TextElementProps>("PbText", ({ elementId, tag }) => {
    return <LexicalText elementId={elementId} tag={tag} />;
});
