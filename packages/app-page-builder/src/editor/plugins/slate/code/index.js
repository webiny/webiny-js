// @flow
import * as React from "react";
import type { Value } from "slate";
import type { Editor } from "slate-react";
import { ReactComponent as CodeIcon } from "@webiny/app-page-builder/editor/assets/icons/code.svg";

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
                render({
                    MenuButton,
                    editor,
                    onChange
                }: {
                    MenuButton: React.ComponentType<*>,
                    editor: React.ElementRef<Editor>,
                    onChange: Function
                }) {
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
            }
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-code",
                type: "pb-editor-slate-editor",
                slate: {
                    renderMark(props: Object, next: Function) {
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
            }
        ]
    };
};
