// @flow
import React from "react";
import type { Change } from "slate";
import { ReactComponent as FormatItalicIcon } from "webiny-app-cms/editor/assets/icons/format_italic.svg";
import { isKeyHotkey } from "is-hotkey";
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
                name: "italic-menu-item",
                type: "cms-slate-menu-item",
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
        ],
        editor: [
            {
                name: "cms-slate-editor-italic",
                type: "cms-slate-editor",
                slate: {
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
                }
            }
        ]
    };
};
