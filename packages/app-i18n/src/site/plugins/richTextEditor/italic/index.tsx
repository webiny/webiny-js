import React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";
import { css } from "emotion";

const italicStyle = css`
    font-style: italic !important;
`;

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-italic",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "italic",
        editor: {
            renderLeaf({ leaf, attributes, children }) {
                if (leaf.italic === true) {
                    return (
                        <em className={italicStyle} {...attributes}>
                            {children}
                        </em>
                    );
                }
                return children;
            }
        }
    }
};

export default [editor];
