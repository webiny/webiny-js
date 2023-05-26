import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { Input } from "@webiny/ui/Input";
import get from "lodash/get";

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
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <Input
                            {...bind}
                            label={field.label}
                            placeholder={field.placeholderText}
                            description={field.helpText}
                            data-testid={`fr.input.text.${field.label}`}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
