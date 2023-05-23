import React from "react";
import { LexicalEditorConfig, TypographyAction } from "@webiny/lexical-editor";
// import {LexicalColorPickerDropdown} from "~/components/ToolbarActionsConfig/LexicalColorPickerDropdown";
import {TypographyDropDown} from "~/components/ToolbarActionsConfig/TypographyDropDown";
import {RichTextStaticToolbarPreset} from "~/components/RitchTextStaticToolbarPreset";
export const LexicalEditorCmsActions = () => {
    return <>
        <RichTextStaticToolbarPreset />
        <LexicalEditorConfig>
            {/*<FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />*/}
            <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
        </LexicalEditorConfig>
    </>
};
