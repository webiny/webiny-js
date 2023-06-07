import { LexicalEditorConfig } from "@webiny/lexical-editor";
import React from "react";
import { LexicalColorPickerDropdown } from "~/components/LexicalColorPickerDropdown";
import { FontColorAction } from "@webiny/lexical-editor";

/*
 * Lexical editor configuration and components with global composition scope
 */
export const LexicalEditorActions = () => {
    return (
        <LexicalEditorConfig>
            <FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />
        </LexicalEditorConfig>
    );
};
