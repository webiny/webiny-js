import * as React from "react";
import { css } from "emotion";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const mark = "bold";

/* prettier-ignore */
const strongStyle = css`
    font-weight: bold !important;
`;

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-bold",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "bold",
        editor: {
            renderLeaf({ leaf, attributes, children }) {
                if (leaf[mark] === true) {
                    return (
                        <strong className={strongStyle} {...attributes}>
                            {children}
                        </strong>
                    );
                }

                return children;
            }
        }
    }
};

export default [editor];
