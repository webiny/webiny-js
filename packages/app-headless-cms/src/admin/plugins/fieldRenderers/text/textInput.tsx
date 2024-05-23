import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { Input } from "@webiny/ui/Input";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { CmsModelFieldRendererPlugin } from "~/types";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
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
                    <DelayedOnChange>
                        <Input
                            label={field.label}
                            placeholder={field.placeholderText}
                            description={field.helpText}
                            data-testid={`fr.input.text.${field.label}`}
                        />
                    </DelayedOnChange>
                </Bind>
            );
        }
    }
};

export default plugin;
