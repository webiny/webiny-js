import isHotkey from "is-hotkey";
import { Editor, Transforms } from "slate";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const LIST_TYPES = ["ordered-list", "unordered-list"];

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-break",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "break",
        editor: {
            onKeyDown({ event, editor }, next) {
                if (isHotkey("shift+enter", event)) {
                    Editor.insertBreak(editor);

                    Transforms.setNodes(editor, {
                        type: "paragraph",
                        children: []
                    });

                    Transforms.unwrapNodes(editor, {
                        match: n => LIST_TYPES.includes(n.type as string),
                        split: true
                    });

                    return;
                }
                return next();
            }
        }
    }
};

export default plugin;
