import React, { FC } from "react";
import { RichTextStaticToolbarPreset } from "./RichTextStaticToolbarPreset";
import { TypographyAction, LexicalEditorConfig } from "@webiny/lexical-editor";
import { TypographyDropDown } from "~/admin/components/LexicalCmsEditor/TypographyDropDown";
import { CompositionScope } from "@webiny/react-composition";

export const LexicalEditorCmsPlugin: FC = () => {
    return (
        <>
            <RichTextStaticToolbarPreset />
            <LexicalEditorConfig>
                <CompositionScope name={"cms"}>
                    <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
                </CompositionScope>
            </LexicalEditorConfig>
        </>
    );
};
