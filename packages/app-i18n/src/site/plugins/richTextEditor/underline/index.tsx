import * as React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-underline",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "underline",
        editor: {
            renderLeaf({ leaf, attributes, children }) {
                if (leaf.underline === true) {
                    return <u {...attributes}>{children}</u>;
                }

                return children;
            }
        }
    }
};

export default [editor];
