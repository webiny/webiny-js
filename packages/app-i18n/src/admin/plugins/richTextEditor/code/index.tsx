import * as React from "react";
import { css } from "emotion";
import { isKeyHotkey } from "is-hotkey";
import { Editor } from "slate";
import { ReactComponent as FormatCodeIcon } from "@webiny/app-i18n/admin/assets/icons/format_code.svg";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isBoldHotkey = isKeyHotkey("mod+`");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, editor, onChange) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

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
            render({ MenuButton, editor, onChange }) {
                const isActive = hasMark(editor.value, mark);

                return (
                    <MenuButton
                        onClick={() => onClickMark(mark, editor, onChange)}
                        active={isActive}
                    >
                        <FormatCodeIcon />
                    </MenuButton>
                );
            }
        },
        editor: {
            onKeyDown(event: React.SyntheticEvent<KeyboardEvent>, editor: Editor, next: Function) {
                // Decide what to do based on the key code...
                if (isBoldHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }

                return next();
            },
            renderMark(props, next) {
                if (props.mark.type === mark) {
                    return (
                        <code className={codeStyle} {...props.attributes}>
                            {props.children}
                        </code>
                    );
                }

                return next();
            }
        }
    }
};

export default plugin;
