import * as React from "react";
import { isKeyHotkey } from "is-hotkey";
import { Editor, Transforms } from "slate";
import { ReactComponent as FormatUnOrderedListIcon } from "@webiny/app-i18n/admin/assets/icons/format_list_bulleted.svg";
import { ReactComponent as FormatOrderedListIcon } from "@webiny/app-i18n/admin/assets/icons/format_list_numbered.svg";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isListHotkey = isKeyHotkey("mod+l");
const LIST_TYPES = ["ordered-list", "unordered-list"];

const isBlockActive = (editor, format) => {
    const [match] = Editor.nodes(editor, {
        match: n => n.type === format
    });

    return !!match;
};

const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format);
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: n => LIST_TYPES.includes(n.type as string),
        split: true
    });

    Transforms.setNodes(editor, {
        type: isActive ? "paragraph" : isList ? "list-item" : format
    });

    if (!isActive && isList) {
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
    }
};

const plugins: I18NInputRichTextEditorPlugin[] = [
    {
        name: "i18n-input-rich-text-editor-unordered-list",
        type: "i18n-input-rich-text-editor",
        plugin: {
            name: "unordered-list",
            menu: {
                render({ MenuButton, editor }) {
                    const isActive = isBlockActive(editor, "unordered-list");

                    return (
                        <MenuButton
                            onClick={() => toggleBlock(editor, "unordered-list")}
                            active={isActive}
                        >
                            <FormatUnOrderedListIcon />
                        </MenuButton>
                    );
                }
            },
            editor: {
                onKeyDown({ event, editor }, next) {
                    if (isListHotkey(event)) {
                        event.preventDefault();
                        return toggleBlock(editor, "unordered-list");
                    }

                    return next();
                },
                renderElement({ attributes, children, element }, next) {
                    switch (element.type) {
                        case "unordered-list":
                            return (
                                <ul
                                    className={"webiny-admin-typography-unordered-list"}
                                    {...attributes}
                                >
                                    {children}
                                </ul>
                            );
                        case "list-item":
                            return <li {...attributes}>{children}</li>;
                        default:
                            return next();
                    }
                }
            }
        }
    },
    {
        name: "i18n-input-rich-text-editor-ordered-list",
        type: "i18n-input-rich-text-editor",
        plugin: {
            name: "ordered-list",
            menu: {
                render({ MenuButton, editor }) {
                    const isActive = isBlockActive(editor, "ordered-list");

                    return (
                        <MenuButton
                            onClick={() => toggleBlock(editor, "ordered-list")}
                            active={isActive}
                        >
                            <FormatOrderedListIcon />
                        </MenuButton>
                    );
                }
            },
            editor: {
                onKeyDown({ event, editor }, next) {
                    if (isListHotkey(event)) {
                        event.preventDefault();
                        return toggleBlock(editor, "ordered-list");
                    }

                    return next();
                },
                renderElement({ attributes, children, element }, next) {
                    switch (element.type) {
                        case "ordered-list":
                            return (
                                <ol
                                    className={"webiny-admin-typography-ordered-list"}
                                    {...attributes}
                                >
                                    {children}
                                </ol>
                            );
                        case "list-item":
                            return <li {...attributes}>{children}</li>;
                        default:
                            return next();
                    }
                }
            }
        }
    }
];

export default plugins;
