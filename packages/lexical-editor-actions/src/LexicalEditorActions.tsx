import { LexicalEditorConfig, TypographyAction } from "@webiny/lexical-editor";
import React from "react";
import { LexicalColorPickerDropdown } from "~/components/LexicalColorPickerDropdown";
import { FontColorAction } from "@webiny/lexical-editor";
import { TypographyDropDown } from "~/components/TypographyDropDown";
import { CompositionScope } from "@webiny/react-composition";

export const LexicalEditorActions = () => {
    return (
        <LexicalEditorConfig>
            <FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />
            <CompositionScope name={"pb"}>
                <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
            </CompositionScope>
        </LexicalEditorConfig>
    );
};
