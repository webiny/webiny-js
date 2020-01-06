import * as React from "react";
import { Editor } from "slate";
import { Editor as SlateEditor } from "slate-react";
import { ReactComponent as UnderlineIcon } from "./../icons/format_underlined.svg";
import { isKeyHotkey } from "is-hotkey";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isUnderlineHotkey = isKeyHotkey("mod+u");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, onChange, editor) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

const mark = "underline";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-underline",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "underline",
        editor: {
            onKeyDown(event: React.SyntheticEvent, editor: Editor, next: Function) {
                // Decide what to do based on the key code...
                if (isUnderlineHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(mark);
                    return true;
                }
                return next();
            },
            renderMark(props, next) {
                if (props.mark.type === mark) {
                    return <u {...props.attributes}>{props.children}</u>;
                }
                return next();
            }
        },
        menu: {
            render({ MenuButton, editor, onChange }) {
                const isActive = hasMark(editor.value, mark);

                return (
                    <MenuButton
                        onClick={() => onClickMark(mark, onChange, editor)}
                        active={isActive}
                    >
                        <UnderlineIcon />
                    </MenuButton>
                );
            }
        }
    }
};

export default plugin;
