import React from "react";
import { ReactComponent as LinkIcon } from "@webiny/app-i18n/admin/assets/icons/link.svg";
import { LinkDialog } from "./LinkDialog";
import { LinkTooltip } from "./LinkTooltip";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-input-rich-text-editor-link",
    type: "i18n-input-rich-text-editor",
    plugin: {
        name: "link",
        menu: {
            render({ MenuButton, editor, activatePlugin }) {
                return (
                    <MenuButton
                        onMouseDown={() => {
                            if (!editor.selection) {
                                return;
                            }

                            activatePlugin("link");
                        }}
                    >
                        <LinkIcon />
                    </MenuButton>
                );
            },
            renderDialog(props) {
                return <LinkDialog {...props} />;
            }
        },
        editor: {
            renderElement(props, next) {
                const { attributes, children, element } = props;

                if (element.type === "link") {
                    const { href, noFollow } = element;
                    return (
                        <a {...attributes} {...{ href, rel: noFollow ? "nofollow" : null }}>
                            {children}
                        </a>
                    );
                }

                return next();
            },
            renderEditor({ activatePlugin }, next) {
                return (
                    <>
                        {next()}
                        <LinkTooltip activatePlugin={activatePlugin} />
                    </>
                );
            }
        }
    }
};

export default plugin;
