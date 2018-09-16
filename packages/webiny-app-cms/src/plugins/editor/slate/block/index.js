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

const setAlign = (align, blockType, editor) => {
    const { value, onChange } = editor;
    const change = value
        .change()
        .setBlocks({
            type: blockType,
            data: { align }
        })
        .focus();
    onChange(change);
};

export default () => {
    return {
        menu: [
            {
                name: "typography-menu-item",
                type: "slate-menu-item",
                render({ MenuButton, editor }: Object) {
                    return (
                        <MenuButton>
                            <TypographySelector editor={editor} />
                        </MenuButton>
                    );
                }
            },
            {
                name: "align-menu-item",
                type: "slate-menu-item",
                render({ MenuButton, editor }: Object) {
                    const block = editor.value.blocks.first();

                    const align = block.data.get("align") || "left";
                    const nextAlign = alignments[alignments.indexOf(align) + 1] || "left";

                    return (
                        // eslint-disable-next-line react/jsx-no-bind
                        <MenuButton onClick={() => setAlign(nextAlign, block.type, editor)}>
                            {React.createElement(icons[align])}
                        </MenuButton>
                    );
                }
            }
        ],
        editor: [
            {
                name: "typography",
                type: "cms-slate-editor",
                slate: {
                    renderNode(props: Object) {
                        const { attributes, children, node, editor } = props;
                        let { type } = node;

                        const { styles } = editor.props.theme;

                        if (styles.hasOwnProperty(type) && styles[type].component) {
                            const { component: Node, className = null } = styles[type];

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
                    }
                }
            }
        ]
    };
};
