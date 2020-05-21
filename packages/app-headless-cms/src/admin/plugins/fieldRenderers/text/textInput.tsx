import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { Input } from "@webiny/ui/Input";

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
            return field.type === "text" && !field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <Input
                            {...bind}
                            label={I18NValue({ value: field.label })}
                            placeholder={I18NValue({ value: field.placeholderText })}
                            description={I18NValue({ value: field.helpText })}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
