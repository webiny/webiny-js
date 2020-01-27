import * as React from "react";
import { ReactComponent as UnderlineIcon } from "@webiny/app-page-builder/editor/assets/icons/format_underlined.svg";
import { isKeyHotkey } from "is-hotkey";
import {
    PbEditorSlateEditorPlugin,
    PbEditorSlateMenuItemPlugin
} from "@webiny/app-page-builder/admin/types";
const isUnderlineHotkey = isKeyHotkey("mod+u");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, onChange, editor) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

const mark = "underline";

export default () => {
    return {
        menu: [
            {
                name: "pb-editor-slate-menu-item-underline",
                type: "pb-editor-slate-menu-item",
                render({ MenuButton, editor, onChange }) {
                    const isActive = hasMark(editor.value, mark);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton
                            onClick={() => onClickMark(mark, onChange, editor)}
                            active={isActive}
                        >
                            <UnderlineIcon />
                        </MenuButton>
                    );
                }
            } as PbEditorSlateMenuItemPlugin
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-underline",
                type: "pb-editor-slate-editor",
                slate: {
                    onKeyDown(event, change) {
                        // Decide what to do based on the key code...
                        if (isUnderlineHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
                        }
                    },
                    renderMark(props, next) {
                        if (props.mark.type === mark) {
                            return <u {...props.attributes}>{props.children}</u>;
                        }
                        return next();
                    }
                }
            } as PbEditorSlateEditorPlugin
        ]
    };
};
