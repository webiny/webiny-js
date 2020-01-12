import * as React from "react";
import { css } from "emotion";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const mark = "bold";

/* prettier-ignore */
const strongStyle = css`
    [class*="mdc-typography--"]: {
        fontWeight: "bold !important";
    }
`;

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-bold",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "bold",
        editor: {
            renderMark(props, next) {
                if (props.mark.type === mark) {
                    return (
                        <strong className={strongStyle} {...props.attributes}>
                            {props.children}
                        </strong>
                    );
                }

                return next();
            }
        }
    }
};

export default [editor];
