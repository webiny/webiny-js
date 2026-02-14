import React from "react";
import get from "lodash/get.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { DelayedOnChange, Input } from "@webiny/admin-ui";

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
                !field.list &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind>
                    {bind => (
                        <Bind.ValidationContainer>
                            <DelayedOnChange
                                value={bind.value}
                                onChange={bind.onChange}
                                onBlur={bind.validate}
                            >
                                <Input
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    description={field.description}
                                    type="number"
                                    data-testid={`fr.input.number.${field.label}`}
                                    validation={bind.validation}
                                />
                            </DelayedOnChange>
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
