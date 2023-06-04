import React from "react";
import { ParagraphToolbarPreset, HeadingToolbarPreset } from "@webiny/lexical-editor";
import { PeTextPlugin } from "~/plugins/PeTextPlugin";
import { HeadingPlugin } from "~/plugins/HeadingPlugin";
import { ParagraphPlugin } from "~/plugins/ParagraphPlugin";
import { RichVariableInputPlugin } from "~/plugins/elementSettings/variables/RichVariableInputPlugin";
import { TextVariableInputPlugin } from "~/plugins/elementSettings/variables/TextVariableInputPlugin";
import { PbTextPlugin } from "~/plugins/PbTextPlugin";
import { TextElementRendererPlugin } from "~/render/plugins/TextElementRendererPlugin";
import { CompositionScope } from "@webiny/react-composition";

export const LexicalEditorPlugin = () => {
    return (
        <>
            <CompositionScope name={"pb"}>
                <HeadingToolbarPreset />
                <ParagraphToolbarPreset />
            </CompositionScope>
            {/* Components */}
            <PeTextPlugin />
            <PbTextPlugin />
            {/* Block editor variables */}
            <RichVariableInputPlugin />
            <TextVariableInputPlugin />
            {/* Render */}
            <HeadingPlugin />
            <ParagraphPlugin />
            {/* Render public website for legacy renderer component */}
            <TextElementRendererPlugin />
        </>
    );
};
