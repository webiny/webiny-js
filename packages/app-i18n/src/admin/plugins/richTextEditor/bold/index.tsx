import * as React from "react";
import { css } from "emotion";
import { isKeyHotkey } from "is-hotkey";
import { ReactComponent as FormatBoldIcon } from "@webiny/app-i18n/admin/assets/icons/format_bold.svg";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isBoldHotkey = isKeyHotkey("mod+b");

const mark = "bold";

/* prettier-ignore */
const strongStyle = css`
    font-weight: bold !important;
`;

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-bold",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "bold",
        menu: {
            render({ MenuButton, editor }) {
                return (
                    <MenuButton
                        onClick={() => editor.toggleMark(mark)}
                        active={editor.hasMark(mark)}
                    >
                        <FormatBoldIcon />
                    </MenuButton>
                );
            }
        },
        editor: {
            onKeyDown({ event, editor }, next) {
                // Decide what to do based on the key code...
                if (isBoldHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }

                return next();
            },
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

export default plugin;
