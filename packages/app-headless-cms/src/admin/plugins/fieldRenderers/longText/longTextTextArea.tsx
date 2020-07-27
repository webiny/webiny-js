import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Input } from "@webiny/ui/Input";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-long-text-textarea",
    renderer: {
        rendererName: "long-text-text-area",
        name: t`Text Area`,
        description: t`Renders a simple text area, suitable for larger amounts of text.`,
        canUse({ field }) {
            return (
                field.type === "long-text" &&
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
                            autoFocus
                            rows={5}
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
