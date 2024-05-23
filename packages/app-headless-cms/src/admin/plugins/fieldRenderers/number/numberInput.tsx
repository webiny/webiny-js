import React from "react";
import get from "lodash/get";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Input } from "@webiny/ui/Input";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

const t = i18n.ns("app-headless-cms/admin/fields/number");

const plugin: CmsModelFieldRendererPlugin = {
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
                    <DelayedOnChange>
                        <Input
                            label={field.label}
                            placeholder={field.placeholderText}
                            description={field.helpText}
                            type="number"
                            data-testid={`fr.input.number.${field.label}`}
                        />
                    </DelayedOnChange>
                </Bind>
            );
        }
    }
};

export default plugin;
