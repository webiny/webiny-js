// @flow
import * as React from "react";
import type { Change } from "slate";
import type { Editor } from "slate-react";
import { ReactComponent as UnderlineIcon } from "@webiny/app-page-builder/editor/assets/icons/format_underlined.svg";
import { isKeyHotkey } from "is-hotkey";
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
                render({
                    MenuButton,
                    editor,
                    onChange
                }: {
                    MenuButton: React.ComponentType<*>,
                    editor: React.ElementRef<Editor>,
                    onChange: Function
                }) {
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
            }
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-underline",
                type: "pb-editor-slate-editor",
                slate: {
                    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change, next: Function) {
                        // Decide what to do based on the key code...
                        if (isUnderlineHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
                            return true;
                        }
                        return next();
                    },
                    renderMark(props: Object, next: Function) {
                        if (props.mark.type === mark) {
                            return <u {...props.attributes}>{props.children}</u>;
                        }
                        return next();
                    }
                }
            }
        ]
    };
};
