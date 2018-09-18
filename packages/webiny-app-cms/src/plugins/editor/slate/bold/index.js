// @flow
import * as React from "react";
import { css } from "emotion";
import { ReactComponent as FormatBoldIcon } from "webiny-app-cms/editor/assets/icons/format_bold.svg";
import type { Change } from "slate";
import { isKeyHotkey } from "is-hotkey";
const isBoldHotkey = isKeyHotkey("mod+b");

const hasMark = (value, type) => {
    return Boolean(value.activeMarks.find(mark => mark.type === type));
};

const onClickMark = (type, editor) => {
    const { value, onChange } = editor;
    const change = value.change().toggleMark(type);
    onChange(change);
};

const mark = "bold";

const strongStyle = css({
    "[class*='mdc-typography--']": {
        fontWeight: "bold !important"
    }
});

export default () => {
    return {
        menu: [
            {
                name: "bold-menu-item",
                type: "cms-slate-menu-item",
                render({ MenuButton, editor }: Object) {
                    const isActive = hasMark(editor.value, mark);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={() => onClickMark(mark, editor)} active={isActive}>
                            <FormatBoldIcon />
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "bold",
                type: "cms-slate-editor",
                slate: {
                    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change) {
                        // Decide what to do based on the key code...
                        if (isBoldHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
                            return true;
                        }
                    },
                    renderMark(props: Object) {
                        if (props.mark.type === mark) {
                            return (
                                <strong className={strongStyle} {...props.attributes}>
                                    {props.children}
                                </strong>
                            );
                        }
                    }
                }
            }
        ]
    };
};
