// @flow
import React from "react";

import { ReactComponent as AlignCenterIcon } from "webiny-app-cms/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "webiny-app-cms/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignJustifyIcon } from "webiny-app-cms/editor/assets/icons/format_align_justify.svg";
import { ReactComponent as AlignRightIcon } from "webiny-app-cms/editor/assets/icons/format_align_right.svg";
import TypographySelector from "./TypographySelector";

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
    });
};

export default () => {
    return {
        menu: [
            {
                name: "typography-menu-item",
                type: "cms-form-rich-editor-menu-item",
                render({ MenuButton, ...props }: Object) {
                    return (
                        <MenuButton>
                            <TypographySelector {...props} />
                        </MenuButton>
                    );
                }
            },
            {
                name: "align-menu-item",
                type: "cms-form-rich-editor-menu-item",
                render({ MenuButton, editor, onChange }: Object) {
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
            }
        ],
        editor: [
            {
                name: "cms-form-rich-editor-typography",
                type: "cms-form-rich-editor",
                slate: {
                    renderNode(props: Object, next: Function) {
                        const { attributes, children, node, editor } = props;
                        let { type } = node;

                        const { typography } = editor.props.theme;

                        if (typography.hasOwnProperty(type) && typography[type].component) {
                            const { component: Node, className = null } = typography[type];

                            let nodeProps = {
                                ...attributes,
                                className,
                                style: { textAlign: `${node.data.get("align")}` }
                            };

                            if (typeof Node !== "string") {
                                nodeProps = props;
                            }

                            return <Node {...nodeProps}>{children}</Node>;
                        }

                        return next();
                    }
                }
            }
        ]
    };
};
