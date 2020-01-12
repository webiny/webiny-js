import isHotkey from "is-hotkey";
import { Editor } from "slate";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const editor: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-break",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "break",
        editor: {
            onKeyDown(e, editor: Editor, next) {
                if (isHotkey("shift+enter", e)) {
                    return editor.splitBlock().setBlocks("paragraph");
                }
                return next();
            }
        }
    }
};

export default [editor];
