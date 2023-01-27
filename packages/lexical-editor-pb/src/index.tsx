import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { HeadingToolbarPreset, ParagraphToolbarPreset } from "@webiny/lexical-editor";
import PbText from "@webiny/app-page-builder/editor/components/Text/PbText";
import { PbText as LexicalPbText } from "./PbText";

const PbTextPlugin = createComponentPlugin(PbText, () => {
    return LexicalPbText;
});

export const LexicalEditorPlugin = () => {
    return (
        <>
            <HeadingToolbarPreset />
            <ParagraphToolbarPreset />
            <PbTextPlugin />
        </>
    );
};
