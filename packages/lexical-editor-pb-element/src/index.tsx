import React from "react";
import { TypographyAction } from "@webiny/lexical-editor";
import { PeTextPlugin } from "~/plugins/PeTextPlugin";
import { HeadingPlugin } from "~/plugins/HeadingPlugin";
import { ParagraphPlugin } from "~/plugins/ParagraphPlugin";
import { RichVariableInputPlugin } from "~/plugins/elementSettings/variables/RichVariableInputPlugin";
import { TextVariableInputPlugin } from "~/plugins/elementSettings/variables/TextVariableInputPlugin";
import { CompositionScope } from "@webiny/react-composition";
import { TypographyDropDown } from "~/components/TypographyDropDown";
import { ParagraphEditorPreset } from "~/components/LexicalPresets/ParagraphEditorPreset";
import { HeadingEditorPreset } from "~/components/LexicalPresets/HeadingEditorPreset";

export const LexicalEditorPlugin = () => {
    return (
        <>
            <CompositionScope name={"pb.paragraph"}>
                <ParagraphEditorPreset />
            </CompositionScope>
            <CompositionScope name={"pb.heading"}>
                <HeadingEditorPreset />
            </CompositionScope>
            <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
            {/* Components */}
            <PeTextPlugin />
            {/* Block editor variables */}
            <RichVariableInputPlugin />
            <TextVariableInputPlugin />
            {/* Render */}
            <HeadingPlugin />
            <ParagraphPlugin />
        </>
    );
};
