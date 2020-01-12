import React from "react";
import { Editor } from "slate";
import { ReactComponent as FormatItalicIcon } from "@webiny/app-i18n/admin/assets/icons/format_italic.svg";
import { isKeyHotkey } from "is-hotkey";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isItalicHotkey = isKeyHotkey("mod+i");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, onChange, editor) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

const mark = "italic";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-italic",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "italic",
        editor: {
            onKeyDown(event: React.SyntheticEvent, editor: Editor, next: Function) {
                if (isItalicHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }
                return next();
            },
            renderMark(props, next) {
                if (props.mark.type === mark) {
                    return <em {...props.attributes}>{props.children}</em>;
                }
                return next();
            }
        },
        menu: {
            render({ MenuButton, editor, onChange }) {
                const isActive = hasMark(editor.value, mark);

                return (
                    // eslint-disable-next-line react/jsx-no-bind
                    <MenuButton
                        onClick={() => onClickMark(mark, onChange, editor)}
                        active={isActive}
                    >
                        <FormatItalicIcon />
                    </MenuButton>
                );
            }
        }
    }
};

export default plugin;
