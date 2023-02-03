import React from "react";
import { ParagraphToolbarPreset, HeadingToolbarPreset } from "@webiny/lexical-editor";
import { PeTextPlugin } from "~/plugins/PeTextPlugin";
import { HeadingPlugin } from "~/plugins/HeadingPlugin";
import { ParagraphPlugin } from "~/plugins/ParagraphPlugin";

export const LexicalEditorPlugin = () => {
    return (
        <>
            <HeadingToolbarPreset />
            <ParagraphToolbarPreset />
            {/* Components */}
            <PeTextPlugin />
            {/* Render */}
            <HeadingPlugin />
            <ParagraphPlugin />
        </>
    );
};
