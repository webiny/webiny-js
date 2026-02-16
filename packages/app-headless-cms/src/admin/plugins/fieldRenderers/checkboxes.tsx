import React from "react";
import get from "lodash/get.js";
import type { CmsModelField, CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { CheckboxGroup } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const adaptToField = (field: CmsModelField, value: string) => {
    return field.type === "number" ? Number(value) : value;
};

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-checkboxes-buttons",
    renderer: {
        rendererName: "checkboxes",
        name: t`Checkboxes`,
        description: t`Renders checkboxes, allowing selection of multiple values.`,
        canUse({ field }) {
            return !!field.list && !!get(field, "predefinedValues.enabled");
        },
        render({ field, getBind }) {
            const Bind = getBind();

            const { values: predefinedOptions = [] } = field.predefinedValues || {
                values: []
            };

            // For `number` field, we want to convert the value to actual Number.
            const options = predefinedOptions.map(opt => ({
                ...opt,
                value: adaptToField(field, opt.value)
            }));

            const defaults = options.filter(option => option.selected);
            const defaultValue = defaults.length > 0 ? defaults.map(opt => opt.value) : undefined;

            return (
                <Bind defaultValue={defaultValue}>
                    {bind => (
                        <Bind.ValidationContainer>
                            <CheckboxGroup
                                {...bind}
                                label={field.label}
                                description={field.description}
                                note={field.note}
                                hint={field.help}
                                value={bind.value}
                                items={options.map(opt => ({
                                    label: opt.label,
                                    value: opt.value,
                                    selected: opt.selected
                                }))}
                            />
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
