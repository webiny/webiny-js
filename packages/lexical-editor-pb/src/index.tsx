import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { ParagraphToolbarPreset, HeadingToolbarPreset } from "@webiny/lexical-editor";
import PeText from "@webiny/app-page-builder/editor/components/Text/PeText";
import { PeText as LexicalPeText } from "./PeText";

const PbTextPlugin = createComponentPlugin(PeText, () => {
    return function PbTextPlugin({ elementId }): JSX.Element {
        return <LexicalPeText elementId={elementId} />;
    };
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
