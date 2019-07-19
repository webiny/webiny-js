// @flow
import * as React from "react";
import type { I18NInputRichTextEditorPluginType } from "webiny-app-i18n/types";

const editor: I18NInputRichTextEditorPluginType = {
    name: "i18n-value-rich-text-editor-underline",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "underline",
        editor: {
            renderMark(props: Object, next: Function) {
                if (props.mark.type === "underline") {
                    return <u {...props.attributes}>{props.children}</u>;
                }
                return next();
            }
        }
    }
};

export default [editor];
