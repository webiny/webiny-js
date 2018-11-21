import React from "react";
import { ReactComponent as LinkIcon } from "webiny-app-cms/editor/assets/icons/link.svg";
import LinkMenu from "./LinkMenu";

export default () => {
    return {
        menu: [
            {
                name: "link-menu-item",
                type: "cms-slate-menu-item",
                render(props: Object) {
                    const { MenuButton } = props;

                    return (
                        <MenuButton onMouseDown={() => props.activatePlugin(this.name)}>
                            <LinkIcon />
                        </MenuButton>
                    );
                },
                renderMenu(props) {
                    return <LinkMenu {...props} />;
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
                    }
                }
            }
        ]
    };
};
