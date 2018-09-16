// @flow
import React from "react";
import type { Change } from "slate";
import { ReactComponent as FormatItalicIcon } from "webiny-app-cms/editor/assets/icons/format_italic.svg";
import { isKeyHotkey } from "is-hotkey";
const isItalicHotkey = isKeyHotkey("mod+i");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, editor) => {
    const { value, onChange } = editor;
    const change = value.change().toggleMark(type);
    onChange(change);
};

const mark = "italic";

export default () => {
    return {
        menu: [
            {
                name: "italic-menu-item",
                type: "slate-menu-item",
                render({ MenuButton, editor }: Object) {
                    const isActive = hasMark(editor.value, mark);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={() => onClickMark(mark, editor)} active={isActive}>
                            <FormatItalicIcon />
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "italic",
                type: "cms-slate-editor",
                slate: {
                    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change) {
                        if (isItalicHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
                            return true;
                        }
                    },
                    renderMark(props: Object) {
                        if (props.mark.type === mark) {
                            return <em {...props.attributes}>{props.children}</em>;
                        }
                    }
                }
            }
        ]
    };
};
