import React from "react";
import { LexicalEditorConfig } from "@webiny/app-headless-cms";
export const CmsLexicalEditorPlugin = () => {
    return (
        <>
            <LexicalEditorConfig.ToolbarAction
                after={"fontColor"}
                name={"myComponent"}
                element={<button>New</button>}
            />
            <LexicalEditorConfig.ToolbarAction
                name={"numberedList"}
                element={<button>NL</button>}
            />
            <LexicalEditorConfig.Plugin name={"quote"} remove />
        </>
    );
};
