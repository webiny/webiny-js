import React from "react";
import {
  AddLexicalEditorConfig,
FontColorAction,
  LexicalEditorConfig,
  TypographyAction
} from "@webiny/lexical-editor";
import {LexicalColorPickerDropdown} from "~/components/LexicalColorPickerDropdown";
import {TypographyDropDown} from "~/components/TypographyDropDown";
import {EditorConfiguration} from "@webiny/lexical-editor/components/LexicalEditorConfig/LexicalEditorConfig";


export const LexicalEditorPbConfiguration = () => {
  return <>
      <EditorConfiguration scope={"pb"} />
          <LexicalEditorConfig>
              <FontColorAction.ColorPicker element={<LexicalColorPickerDropdown />} />
              <TypographyAction.TypographyDropDown element={<TypographyDropDown />} />
          </LexicalEditorConfig>



  </>
}
