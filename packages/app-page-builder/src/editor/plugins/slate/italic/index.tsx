import React from "react";
import { ReactComponent as FormatItalicIcon } from "@webiny/app-page-builder/editor/assets/icons/format_italic.svg";
import { isKeyHotkey } from "is-hotkey";
import {
    PbEditorSlateEditorPlugin,
    PbEditorSlateMenuItemPlugin
} from "@webiny/app-page-builder/types";
const isItalicHotkey = isKeyHotkey("mod+i");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, onChange, editor) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

const mark = "italic";

export default () => {
    return {
        menu: [
            {
                name: "pb-editor-slate-menu-item-italic",
                type: "pb-editor-slate-menu-item",
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
            } as PbEditorSlateMenuItemPlugin
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-italic",
                type: "pb-editor-slate-editor",
                slate: {
                    onKeyDown(event, change, next) {
                        if (isItalicHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
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
                }
            } as PbEditorSlateEditorPlugin
        ]
    };
};
