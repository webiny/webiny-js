import React from "react";
import { ReactComponent as LinkIcon } from "@webiny/app-i18n/admin/assets/icons/link.svg";
import LinkDialog from "./LinkDialog";
import LinkTooltip from "./LinkTooltip";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-link",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "link",
        editor: {
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
                    <div>
                        {children}
                        <LinkTooltip
                            editor={editor}
                            onChange={onChange}
                            activatePlugin={activatePlugin}
                        />
                    </div>
                );
            }
        },
        menu: {
            render({ MenuButton, activatePlugin }) {
                return (
                    <MenuButton onMouseDown={() => activatePlugin("link")}>
                        <LinkIcon />
                    </MenuButton>
                );
            },
            renderDialog(props) {
                return <LinkDialog {...props} />;
            }
        }
    }
};

export default plugin;
