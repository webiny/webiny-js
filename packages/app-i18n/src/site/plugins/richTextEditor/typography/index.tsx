import * as React from "react";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";
import theme from "./theme";

const plugin: I18NInputRichTextEditorPlugin = {
    name: "i18n-value-rich-text-editor-typography",
    type: "i18n-value-rich-text-editor",
    plugin: {
        name: "typography",

        editor: {
            renderElement(props, next) {
                const { attributes, children, element } = props;
                // @ts-ignore
                const { type } = element;

                // @ts-ignore
                const { typography } = theme;

                if (typography.hasOwnProperty(type) && typography[type].component) {
                    const { component: Component, className = null } = typography[type];

                    let nodeProps: any = {
                        ...attributes,
                        className
                    };

                    if (typeof Component !== "string") {
                        nodeProps = props;
                    }

                    return <Component {...nodeProps}>{children}</Component>;
                }

                return next();
            }
        }
    }
};

export default plugin;
