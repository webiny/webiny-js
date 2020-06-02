import React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-link",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "link",
        editor: {
            renderElement(props, next) {
                const { attributes, children, element } = props;

                if (element.type === "link") {
                    const { href, noFollow, newTab } = element;
                    return (
                        <a
                            {...attributes}
                            {...{
                                href,
                                rel: noFollow ? "nofollow" : null,
                                target: newTab ? "_blank" : "_self"
                            }}
                        >
                            {children}
                        </a>
                    );
                }

                return next();
            }
        }
    }
};

export default plugin;
