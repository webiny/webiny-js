// @flow
import * as React from "react";
import type { Value } from "slate";
import { ReactComponent as CodeIcon } from "webiny-app-cms/editor/assets/icons/code.svg";

const MARK = "code";

const hasMark = (value: Value, type: string): boolean => {
    return Boolean(value.marks.find(mark => mark.type === type));
};

const onClickMark = (type, editor) => {
    const { value, onChange } = editor;
    const change = value.change().toggleMark(type);
    onChange(change);
};

export default () => {
    return {
        menu: [
            {
                name: "code-menu-item",
                type: "cms-slate-menu-item",
                render({
                    MenuButton,
                    editor
                }: {
                    MenuButton: React.ComponentType<*>,
                    editor: { value: Value, onChange: Function }
                }) {
                    const isActive = hasMark(editor.value, MARK);

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={() => onClickMark(MARK, editor)} active={isActive}>
                            <CodeIcon />
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "code",
                type: "cms-slate-editor",
                slate: {
                    renderMark(props: Object) {
                        if (props.mark.type === MARK) {
                            return (
                                <code
                                    className={"webiny-cms-typography-code"}
                                    {...props.attributes}
                                >
                                    {props.children}
                                </code>
                            );
                        }
                    }
                }
            }
        ]
    };
};
