import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Input } from "@webiny/ui/Input";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-text",
    renderer: {
        rendererName: "text-input",
        name: t`Text Input`,
        description: t`Renders a simple input with its type set to "text".`,
        canUse({ field }) {
            return (
                field.type === "text" &&
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
                    {bind => (
                        <Input
                            {...bind}
                            label={label}
                            placeholder={placeholderText}
                            description={helpText}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
