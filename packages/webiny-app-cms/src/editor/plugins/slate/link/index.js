import React, { Fragment } from "react";
import { ReactComponent as LinkIcon } from "webiny-app-cms/editor/assets/icons/link.svg";
import LinkDialog from "./LinkDialog";
import LinkTooltip from "./LinkTooltip";

export default () => {
    return {
        menu: [
            {
                name: "cms-slate-menu-item-link",
                type: "cms-slate-menu-item",
                render(props: Object) {
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
            }
        ],
        editor: [
            {
                name: "cms-slate-editor-link",
                type: "cms-slate-editor",
                slate: {
                    renderNode(props, next) {
                        const { attributes, children, node } = props;

                        if (node.type === "link") {
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
            }
        ]
    };
};
