import * as React from "react";
import { Value } from "slate";
import { ReactComponent as CodeIcon } from "@webiny/app-page-builder/editor/assets/icons/code.svg";
import {
    PbEditorSlateEditorPlugin,
    PbEditorSlateMenuItemPlugin
} from "@webiny/app-page-builder/types";

const MARK = "code";

const hasMark = (value: Value, type: string): boolean => {
    return Boolean(value.marks.find(mark => mark.type === type));
};

const onClickMark = (type, editor, onChange) => {
    editor.change(change => onChange(change.toggleMark(type)));
};

export default () => {
    return {
        menu: [
            {
                name: "pb-editor-slate-menu-item-code",
                type: "pb-editor-slate-menu-item",
                render({ MenuButton, editor, onChange }) {
                    const isActive = hasMark(editor.value, MARK);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton
                            onClick={() => onClickMark(MARK, editor, onChange)}
                            active={isActive}
                        >
                            <CodeIcon />
                        </MenuButton>
                    );
                }
            } as PbEditorSlateMenuItemPlugin
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-code",
                type: "pb-editor-slate-editor",
                slate: {
                    renderMark(props, editor, next) {
                        if (props.mark.type === MARK) {
                            return (
                                <code className={"webiny-pb-typography-code"} {...props.attributes}>
                                    {props.children}
                                </code>
                            );
                        }

                        return next();
                    }
                }
            } as PbEditorSlateEditorPlugin
        ]
    };
};
