// @flow
import isHotkey from "is-hotkey";
import type { Change } from "slate";
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPluginType = {
    name: "i18n-input-rich-text-editor-break",
    type: "i18n-input-rich-text-editor",
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

export default plugin;
