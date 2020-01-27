import React, { Fragment } from "react";
import { ReactComponent as LinkIcon } from "@webiny/app-page-builder/editor/assets/icons/link.svg";
import LinkDialog from "./LinkDialog";
import LinkTooltip from "./LinkTooltip";
import {
    PbEditorSlateEditorPlugin,
    PbEditorSlateMenuItemPlugin
} from "@webiny/app-page-builder/types";

export default () => {
    return {
        menu: [
            {
                name: "pb-editor-slate-menu-item-link",
                type: "pb-editor-slate-menu-item",
                render(props) {
                    const { MenuButton } = props;

                    return (
                        <MenuButton onMouseDown={() => props.activatePlugin(this.name)}>
                            <LinkIcon />
                        </MenuButton>
                    );
                },
                renderDialog(props) {
                    return <LinkDialog {...props} />;
                }
            } as PbEditorSlateMenuItemPlugin
        ],
        editor: [
            {
                name: "pb-editor-slate-editor-link",
                type: "pb-editor-slate-editor",
                slate: {
                    renderNode(props, next) {
                        const { attributes, children, node } = props;

                        // @ts-ignore
                        if (node.type === "link") {
                            // @ts-ignore
                            const { data } = node;
                            const href = data.get("href");
                            const noFollow = data.get("noFollow");
                            return (
                                <a {...attributes} {...{ href, rel: noFollow ? "nofollow" : null }}>
                                    {children}
                                </a>
                            );
                        }

                        return next();
                    },
                    renderEditor({ editor, onChange, activatePlugin }, next) {
                        // @ts-ignore
                        const children = next();

                        return (
                            <Fragment>
                                {children}
                                <LinkTooltip
                                    editor={editor}
                                    onChange={onChange}
                                    activatePlugin={activatePlugin}
                                />
                            </Fragment>
                        );
                    }
                }
            } as PbEditorSlateEditorPlugin
        ]
    };
};
