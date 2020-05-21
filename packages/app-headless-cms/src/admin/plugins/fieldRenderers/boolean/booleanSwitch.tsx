import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
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
            return field.type === "boolean" && !field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bindProps => (
                        <Switch
                            {...bindProps}
                            label={I18NValue({ value: field.label })}
                            description={I18NValue({ value: field.helpText })}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
