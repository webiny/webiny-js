import * as React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-underline",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "underline",
        editor: {
            renderMark(props, next) {
                if (props.mark.type === "underline") {
                    return <u {...props.attributes}>{props.children}</u>;
                }
                return next();
            }
        }
    }
};

export default [editor];
