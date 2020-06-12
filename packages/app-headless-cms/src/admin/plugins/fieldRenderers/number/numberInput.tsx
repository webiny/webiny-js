import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { Input } from "@webiny/ui/Input";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/number");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-number",
    renderer: {
        rendererName: "number-input",
        name: t`Number Input`,
        description: t`Renders a simple input with its type set to "number".`,
        canUse({ field }) {
            return (
                field.type === "number" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bindProps => {
                        return (
                            <Input
                                {...bindProps}
                                onChange={value => {
                                    value = parseFloat(value);
                                    return bindProps.onChange(value);
                                }}
                                label={I18NValue({ value: field.label })}
                                placeholder={I18NValue({ value: field.placeholderText })}
                                description={I18NValue({ value: field.helpText })}
                                type="number"
                            />
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
