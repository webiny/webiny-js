import * as React from "react";
import { ReactComponent as UnderlineIcon } from "./../icons/format_underlined.svg";
import { isKeyHotkey } from "is-hotkey";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isUnderlineHotkey = isKeyHotkey("mod+u");

const mark = "underline";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-underline",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "underline",
        menu: {
            render({ MenuButton, editor }) {
                return (
                    <MenuButton
                        onClick={() => editor.toggleMark(mark)}
                        active={editor.hasMark(mark)}
                    >
                        <UnderlineIcon />
                    </MenuButton>
                );
            }
        },
        editor: {
            onKeyDown({ event, editor }, next) {
                // Decide what to do based on the key code...
                if (isUnderlineHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }

                return next();
            },
            renderLeaf({ leaf, attributes, children }) {
                if (leaf[mark] === true) {
                    return <u {...attributes}>{children}</u>;
                }

                return children;
            }
        }
    }
};

export default plugin;
