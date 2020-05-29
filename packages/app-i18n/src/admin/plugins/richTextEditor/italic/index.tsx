import React from "react";
import { ReactComponent as FormatItalicIcon } from "@webiny/app-i18n/admin/assets/icons/format_italic.svg";
import { isKeyHotkey } from "is-hotkey";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";
import { css } from "emotion";

const isItalicHotkey = isKeyHotkey("mod+i");

const mark = "italic";

/* prettier-ignore */
const italicStyle = css`
    font-style: italic !important;
`;

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-italic",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "italic",
        editor: {
            onKeyDown({ event, editor }, next) {
                if (isItalicHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }

                return next();
            },
            renderLeaf({ leaf, attributes, children }) {
                if (leaf[mark] === true) {
                    return (
                        <em className={italicStyle} {...attributes}>
                            {children}
                        </em>
                    );
                }
                return children;
            }
        },
        menu: {
            render({ MenuButton, editor }) {
                return (
                    // eslint-disable-next-line react/jsx-no-bind
                    <MenuButton
                        onClick={() => editor.toggleMark(mark)}
                        active={editor.hasMark(mark)}
                    >
                        <FormatItalicIcon />
                    </MenuButton>
                );
            }
        }
    }
};

export default plugin;
