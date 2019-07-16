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

const onClickMark = (type, editor, onChange) => {
    editor.change(change => onChange(change.toggleMark(type)));
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
                name: "i18n-rich-editor-menu-item-bold",
                type: "i18n-rich-editor-menu-item",
                render({ MenuButton, editor, onChange }: Object) {
                    const isActive = hasMark(editor.value, mark);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={() => onClickMark(mark, editor, onChange)} active={isActive}>
                            <FormatBoldIcon />
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "i18n-rich-editor-bold",
                type: "i18n-rich-editor",
                slate: {
                    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change, next: Function) {
                        // Decide what to do based on the key code...
                        if (isBoldHotkey(event)) {
                            event.preventDefault();
                            change.toggleMark(mark);
                            return true;
                        }

                        return next();
                    },
                    renderMark(props: Object, next: Function) {
                        if (props.mark.type === mark) {
                            return (
                                <strong className={strongStyle} {...props.attributes}>
                                    {props.children}
                                </strong>
                            );
                        }

                        return next();
                    }
                }
            }
        ]
    };
};
