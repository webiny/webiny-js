// @flow
import * as React from "react";
import type { Editor } from "slate-react";
import { ReactComponent as OrderedListIcon } from "../icons/format_list_numbered.svg";
import { ReactComponent as UnorderedListIcon } from "../icons/format_list_bulleted.svg";

const hasBlock = (value, type) => {
    return value.blocks.some(node => node.type === type);
};

const onClickBlock = (type, onChange, editor) => {
    editor.change(change => {
        const { value } = change;
        const { document } = value;

        // Handle the extra wrapping required for list buttons.
        const isList = hasBlock(editor.value, "list-item");
        const isType = value.blocks.some(block => {
            return !!document.getClosest(block.key, parent => parent.type === type);
        });

        if (isList && isType) {
            change
                .setBlocks("paragraph")
                .unwrapBlock("unordered-list")
                .unwrapBlock("ordered-list");
        } else if (isList) {
            change
                .unwrapBlock(type === "unordered-list" ? "ordered-list" : "unordered-list")
                .wrapBlock(type);
        } else {
            change.setBlocks("list-item").wrapBlock(type);
        }

        onChange(change);
    });
};

export default () => {
    return {
        menu: [
            {
                name: "i18n-rich-editor-menu-item-ordered-list",
                type: "i18n-rich-editor-menu-item",
                render({
                    MenuButton,
                    editor,
                    onChange
                }: {
                    MenuButton: React.ComponentType<*>,
                    editor: React.ElementRef<Editor>,
                    onChange: Function
                }) {
                    const isActive = hasBlock(editor.value, "ordered-list");

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton
                            onClick={() => onClickBlock("ordered-list", onChange, editor)}
                            active={isActive}
                        >
                            <OrderedListIcon />
                        </MenuButton>
                    );
                }
            },
            {
                name: "i18n-rich-editor-menu-item-unordered-list",
                type: "i18n-rich-editor-menu-item",
                render({
                    MenuButton,
                    editor,
                    onChange
                }: {
                    MenuButton: React.ComponentType<*>,
                    editor: React.ElementRef<Editor>,
                    onChange: Function
                }) {
                    const isActive = hasBlock(editor.value, "unordered-list");

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton
                            onClick={() => onClickBlock("unordered-list", onChange, editor)}
                            active={isActive}
                        >
                            <UnorderedListIcon />
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "i18n-rich-editor-lists",
                type: "i18n-rich-editor",
                slate: {
                    renderNode(props: Object, next: Function) {
                        const { attributes, children, node } = props;

                        switch (node.type) {
                            case "unordered-list":
                                return (
                                    <ul
                                        className={"webiny-forms-typography-unordered-list"}
                                        {...attributes}
                                    >
                                        {children}
                                    </ul>
                                );
                            case "list-item":
                                return <li {...attributes}>{children}</li>;
                            case "ordered-list":
                                return (
                                    <ol
                                        className={"webiny-forms-typography-ordered-list"}
                                        {...attributes}
                                    >
                                        {children}
                                    </ol>
                                );
                            default:
                                return next();
                        }
                    }
                }
            }
        ]
    };
};
