import * as React from "react";
import { css } from "emotion";
import { isKeyHotkey } from "is-hotkey";
import { Editor } from "slate";
import { ReactComponent as FormatBoldIcon } from "@webiny/app-i18n/admin/assets/icons/format_bold.svg";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isBoldHotkey = isKeyHotkey("mod+b");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, editor, onChange) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

const mark = "bold";

/* prettier-ignore */
const strongStyle = css`
    [class*="mdc-typography--"] {
        fontWeight: "bold !important";
    }
`;

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-bold",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "bold",
        menu: {
            render({ MenuButton, editor, onChange }) {
                const isActive = hasMark(editor.value, mark);

                return (
                    <MenuButton
                        onClick={() => onClickMark(mark, editor, onChange)}
                        active={isActive}
                    >
                        <FormatBoldIcon />
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
                        <strong className={strongStyle} {...props.attributes}>
                            {props.children}
                        </strong>
                    );
                }

                return next();
            }
        }
    }
};

export default plugin;
