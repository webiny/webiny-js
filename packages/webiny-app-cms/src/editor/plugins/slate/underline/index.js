// @flow
import React from "react";
import type { Change } from "slate";
import { ReactComponent as UnderlineIcon } from "webiny-app-cms/editor/assets/icons/format_underlined.svg";
import { isKeyHotkey } from "is-hotkey";
const isUnderlineHotkey = isKeyHotkey("mod+u");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, editor) => {
    const { value, onChange } = editor;
    const change = value.change().toggleMark(type);
    onChange(change);
};

const mark = "underline";

export default () => {
    return {
        menu: [
            {
                name: "underline-menu-item",
                type: "cms-slate-menu-item",
                render({ MenuButton, editor }: Object) {
                    const isActive = hasMark(editor.value, mark);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={() => onClickMark(mark, editor)} active={isActive}>
                            <UnderlineIcon />
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "cms-slate-editor-underline",
                type: "cms-slate-editor",
                slate: {
                    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change) {
                        // Decide what to do based on the key code...
                        if (isUnderlineHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
                            return true;
                        }
                    },
                    renderMark(props: Object) {
                        if (props.mark.type === mark) {
                            return <u {...props.attributes}>{props.children}</u>;
                        }
                    }
                }
            }
        ]
    };
};
