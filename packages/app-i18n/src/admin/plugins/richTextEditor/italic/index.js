// @flow
import React from "react";
import type { Change } from "slate";
import { ReactComponent as FormatItalicIcon } from "@webiny/app-page-builder/editor/assets/icons/format_italic.svg";
import { isKeyHotkey } from "is-hotkey";
const isItalicHotkey = isKeyHotkey("mod+i");
import type { I18NInputRichTextEditorPluginType } from "@webiny/app-i18n/types";

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, onChange, editor) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

const mark = "italic";

const plugin: I18NInputRichTextEditorPluginType = {
    name: "i18n-input-rich-text-editor-italic",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "italic",
        editor: {
            onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change, next: Function) {
                if (isItalicHotkey(event)) {
                    event.preventDefault();
                    change.toggleMark(mark);
                    return true;
                }
                return next();
            },
            renderMark(props: Object, next: Function) {
                if (props.mark.type === mark) {
                    return <em {...props.attributes}>{props.children}</em>;
                }
                return next();
            }
        },
        menu: {
            render({ MenuButton, editor, onChange }: Object) {
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
