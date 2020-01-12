import React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-italic",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "italic",
        editor: {
            renderMark(props, next) {
                if (props.mark.type === "italic") {
                    return <em {...props.attributes}>{props.children}</em>;
                }
                return next();
            }
        }
    }
};

export default [editor];
