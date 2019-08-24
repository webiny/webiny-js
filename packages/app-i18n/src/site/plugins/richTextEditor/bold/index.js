// @flow
import * as React from "react";
import { css } from "emotion";
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const mark = "bold";

const strongStyle = css({
    "[class*='mdc-typography--']": {
        fontWeight: "bold !important"
    }
});

const editor: I18NInputRichTextEditorPluginType = {
    name: "i18n-value-rich-text-editor-bold",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "bold",
        editor: {
            renderMark(props: Object, next: Function) {
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
