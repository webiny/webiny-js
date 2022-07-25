import React from "react";
import get from "lodash/get";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { Switch } from "@webiny/ui/Switch";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields/boolean");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-boolean",
    renderer: {
        rendererName: "boolean-input",
        name: t`Boolean Input`,
        description: t`Renders a simple switch button.`,
        canUse({ field }) {
            return (
                field.type === "boolean" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bindProps => (
                        <Switch
                            {...bindProps}
                            label={field.label}
                            description={field.helpText}
                            data-testid={`fr.input.boolean.${field.label}`}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
