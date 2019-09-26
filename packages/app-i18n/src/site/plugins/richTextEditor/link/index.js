import React from "react";
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPluginType = {
    name: "i18n-value-rich-text-editor-link",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "link",
        editor: {
            renderNode(props, next) {
                const { attributes, children, node } = props;

                if (node.type === "link") {
                    const { data } = node;
                    const href = data.get("href");
                    const noFollow = data.get("noFollow");
                    return (
                        <a {...attributes} {...{ href, rel: noFollow ? "nofollow" : null }}>
                            {children}
                        </a>
                    );
                }

                return next();
            }
        }
    }
};

export default [editor];
