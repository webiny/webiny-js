import isHotkey from "is-hotkey";
import { Editor } from "slate";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-break",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "break",
        editor: {
            onKeyDown(e: React.SyntheticEvent, editor: Editor, next: Function) {
                if (isHotkey("shift+enter", e)) {
                    return editor.splitBlock().setBlocks("paragraph");
                }
                return next();
            }
        }
    }
};

export default plugin;
