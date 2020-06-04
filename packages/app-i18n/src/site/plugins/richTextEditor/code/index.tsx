import * as React from "react";
import { css } from "emotion";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-code",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "code",
        editor: {
            renderLeaf({ leaf, attributes, children }) {
                if (leaf.code === true) {
                    return (
                        <code className={"webiny-rich-typography-code"} {...attributes}>
                            {children}
                        </code>
                    );
                }

                return children;
            }
        }
    }
};

export default plugin;
