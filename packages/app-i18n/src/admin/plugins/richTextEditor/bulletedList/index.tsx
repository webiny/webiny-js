import * as React from "react";
import { isKeyHotkey } from "is-hotkey";
import { Editor } from "slate";
import { ReactComponent as FormatUnOrderedListIcon } from "@webiny/app-i18n/admin/assets/icons/format_list_bulleted.svg";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const isBoldHotkey = isKeyHotkey("mod+l");

const hasType = (value, type) => {
    const { document, blocks } = value;
    return blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type === type);
    });
}

const hasBlock = (value, type) => {
    return value.blocks.some(node => node.type === type);
};

const onClickBlock = (type, editor, onChange) => {
    editor.change(change => {
        const { value } = change;

        // Handle the extra wrapping required for list buttons.
        const isList = hasBlock(editor.value, "list-item");
        const isType = hasType(value, block);

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

const block = "unordered-list";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-unordered-list",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "unordered-list",
        menu: {
            render({ MenuButton, editor, onChange }) {
                const isActive = hasType(editor.value, block);

                return (
                    <MenuButton
                        onClick={() => onClickBlock(block, editor, onChange)}
                        active={isActive}
                    >
                        <FormatUnOrderedListIcon />
                    </MenuButton>
                );
            }
        },
        editor: {
            onKeyDown(event: React.SyntheticEvent<KeyboardEvent>, editor: Editor, next: Function) {
                // Decide what to do based on the key code...
                if (isBoldHotkey(event)) {
                    event.preventDefault();
                    editor.toggleMark(block);
                    return true;
                }

                return next();
            },
            renderNode(props, next) {
                const { attributes, children, node } = props;

                // @ts-ignore
                switch (node.type) {
                    case "unordered-list":
                        return (
                            <ul
                                className={"webiny-pb-typography-unordered-list"}
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
};

export default plugin;
