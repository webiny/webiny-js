import React from "react";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { DelayedOnChange, Input } from "@webiny/admin-ui";
import { useFieldEffectiveRules, useModelField } from "@webiny/app-headless-cms-common";

const t = i18n.ns("app-headless-cms/admin/fields/number");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-number",
    renderer: {
        rendererName: "number-input",
        name: t`Number Input`,
        description: t`Renders a simple input with its type set to "number".`,
        canUse({ field }) {
            return field.type === "number" && !field.list && !field.predefinedValues?.enabled;
        },
        render({ getBind }) {
            const { field } = useModelField();
            const rules = useFieldEffectiveRules(field);
            const disabled = !rules.canEdit || rules.disabled;
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
                                    disabled={disabled}
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    description={field.description}
                                    note={field.note}
                                    hint={field.help}
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
