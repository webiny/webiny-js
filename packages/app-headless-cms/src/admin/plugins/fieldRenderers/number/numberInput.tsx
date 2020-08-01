import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Input } from "@webiny/ui/Input";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
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
        render({ field, getBind, locale }) {
            const Bind = getBind();
            const { getValue } = useI18N();

            const label = getValue(field.label, locale);
            const placeholderText = getValue(field.placeholderText, locale);
            const helpText = getValue(field.helpText, locale);

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
                                label={label}
                                placeholder={placeholderText}
                                description={helpText}
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
