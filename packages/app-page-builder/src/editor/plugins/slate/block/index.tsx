import React from "react";
import { ReactComponent as AlignCenterIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignJustifyIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_justify.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_right.svg";
import TypographySelector from "./TypographySelector";
import {
    PbEditorSlateEditorPlugin,
    PbEditorSlateMenuItemPlugin
} from "@webiny/app-page-builder/types";

// Icons map for dynamic render
const icons = {
    left: AlignLeftIcon,
    center: AlignCenterIcon,
    right: AlignRightIcon,
    justify: AlignJustifyIcon
};

// Alignment types for faster access
const alignments = Object.keys(icons);

const setAlign = (align, blockType, onChange, editor) => {
    editor.change(change => {
        change
            .setBlocks({
                type: blockType,
                data: { align }
            })
            .focus();
        onChange(change);
        return change;
    });
};

export default () => {
    return {
        menu: [
            {
                name: "pb-editor-slate-menu-item-typography",
                type: "pb-editor-slate-menu-item",
                render({ MenuButton, ...props }) {
                    return (
                        <MenuButton>
                            <TypographySelector {...props} />
                        </MenuButton>
                    );
                }
            } as PbEditorSlateMenuItemPlugin,
            {
                name: "pb-editor-slate-menu-item-align",
                type: "pb-editor-slate-menu-item",
                render({ MenuButton, editor, onChange }) {
                    const block = editor.value.blocks.first();

                    const align = block.data.get("align") || "left";
                    const nextAlign = alignments[alignments.indexOf(align) + 1] || "left";

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton
                            onClick={() => setAlign(nextAlign, block.type, onChange, editor)}
                        >
                            {React.createElement(icons[align])}
                        </MenuButton>
                    );
                }
            } as PbEditorSlateMenuItemPlugin
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-typography",
                type: "pb-editor-slate-editor",
                slate: {
                    renderNode(props, next) {
                        const { attributes, children, node, editor } = props;
                        // @ts-ignore
                        const { type } = node;

                        // @ts-ignore
                        const { typography } = editor.props.theme;

                        if (typography.hasOwnProperty(type) && typography[type].component) {
                            const { component: Component, className = null } = typography[type];

                            let nodeProps: any = {
                                ...attributes,
                                className,
                                // @ts-ignore
                                style: { textAlign: `${node.data.get("align")}` }
                            };

                            if (typeof Component !== "string") {
                                nodeProps = props;
                            }

                            return <Component {...nodeProps}>{children}</Component>;
                        }

                        return next();
                    }
                }
            } as PbEditorSlateEditorPlugin
        ]
    };
};
