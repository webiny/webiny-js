// @flow
import isHotkey from "is-hotkey";
import type { Change } from "slate";
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPluginType = {
    name: "i18n-value-rich-text-editor-break",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "break",
        editor: {
            onKeyDown(e: SyntheticKeyboardEvent<*>, change: Change, next: Function) {
                if (isHotkey("shift+enter", e)) {
                    return change.splitBlock().setBlocks("paragraph");
                }
                return next();
            }
        }
    }
};

export default [editor];
