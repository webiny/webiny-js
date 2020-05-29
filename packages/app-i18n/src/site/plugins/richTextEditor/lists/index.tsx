import * as React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const plugins: I18NInputRichTextEditorPlugin[] = [
    {
        name: "i18n-value-rich-text-editor-unordered-list",
        type: "i18n-value-rich-text-editor",
        plugin: {
            name: "unordered-list",
            editor: {
                renderElement({ attributes, children, element }, next) {
                    switch (element.type) {
                        case "unordered-list":
                            return (
                                <ul
                                    className={"webiny-rich-typography-unordered-list"}
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
    },
    {
        name: "i18n-value-rich-text-editor-ordered-list",
        type: "i18n-value-rich-text-editor",
        plugin: {
            name: "ordered-list",
            editor: {
                renderElement({ attributes, children, element }, next) {
                    switch (element.type) {
                        case "ordered-list":
                            return (
                                <ol
                                    className={"webiny-rich-typography-ordered-list"}
                                    {...attributes}
                                >
                                    {children}
                                </ol>
                            );
                        case "list-item":
                            return <li {...attributes}>{children}</li>;
                        default:
                            return next();
                    }
                }
            }
        }
    }
];

export default plugins;
