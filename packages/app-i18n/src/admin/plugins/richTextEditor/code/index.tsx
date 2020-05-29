import * as React from "react";
import { css } from "emotion";
import { isKeyHotkey } from "is-hotkey";
import { ReactComponent as FormatCodeIcon } from "@webiny/app-i18n/admin/assets/icons/format_code.svg";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isCodeHotkey = isKeyHotkey("mod+`");

const mark = "code";

/* prettier-ignore */
const codeStyle = css`
    background-color: var(--mdc-theme-background);
    padding: 4px 8px;
    line-height: 1.5rem;
`;

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-code",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "code",
        menu: {
            render({ MenuButton, editor }) {
                return (
                    <MenuButton
                        onClick={() => editor.toggleMark(mark)}
                        active={editor.hasMark(mark)}
                    >
                        <FormatCodeIcon />
                    </MenuButton>
                );
            }
        },
        editor: {
            onKeyDown({ event, editor }, next) {
                // Decide what to do based on the key code...
                if (isCodeHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }

                return next();
            },
            renderLeaf({ leaf, attributes, children }) {
                if (leaf[mark] === true) {
                    return (
                        <code className={"webiny-rich-typography-code"} {...attributes}>
                            {children}
                        </code>
                    );
                }

                return children;
            }
        }
    }
};

export default plugin;
