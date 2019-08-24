// @flow
import React from "react";
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPluginType = {
    name: "i18n-value-rich-text-editor-italic",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "italic",
        editor: {
            renderMark(props: Object, next: Function) {
                if (props.mark.type === "italic") {
                    return <em {...props.attributes}>{props.children}</em>;
                }
                return next();
            }
        }
    }
};

export default [editor];
