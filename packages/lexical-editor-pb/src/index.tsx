import React from "react";
import { ParagraphToolbarPreset, HeadingToolbarPreset } from "@webiny/lexical-editor";
import { HeadingPlugin } from "~/elements/Heading/HeadingPlugin";
import { PeTextPlugin } from "~/components/PeText/PeTextPlugin";

export const LexicalEditorPlugin = () => {
    return (
        <>
            <HeadingToolbarPreset />
            <ParagraphToolbarPreset />
            <PeTextPlugin />
            <HeadingPlugin />
        </>
    );
};
