import React, {FC} from "react";
import {

} from "@webiny/lexical-editor";
import {EditorConfiguration} from "@webiny/lexical-editor/components/LexicalEditorConfig/LexicalEditorConfig";


export const LexicalEditorCmsConfiguration:FC = () => {
  return <>
      <EditorConfiguration scope={"cms"} />
  </>
}
