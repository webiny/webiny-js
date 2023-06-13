import { LexicalEditorConfig, TypographyAction, TextAlignmentAction } from "@webiny/lexical-editor";
import React from "react";
import { LexicalColorPickerDropdown } from "~/components/LexicalColorPickerDropdown";
import { FontColorAction } from "@webiny/lexical-editor";
import { TypographyDropDown } from "~/components/TypographyDropDown";
import { TextAlignmentDropdown } from "~/components/TextAlignmentDropdown";

export const LexicalEditorActions = () => {
    return (
        <LexicalEditorConfig>
            <FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />
            <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
            <TextAlignmentAction.TextAlignmentDropDown element={<TextAlignmentDropdown />} />
        </LexicalEditorConfig>
    );
};
