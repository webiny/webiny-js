import React from "react";
import get from "lodash/get.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { RadioGroup } from "@webiny/admin-ui";
import { useFieldEffectiveRules, useModelField } from "@webiny/app-headless-cms-common";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-radio-buttons",
    renderer: {
        rendererName: "radio-buttons",
        name: t`Radio Buttons`,
        description: t`Renders radio buttons, allowing selection of a single value.`,
        canUse({ field }) {
            return !field.list && !!get(field, "predefinedValues.enabled");
        },
        render({ getBind }) {
            const { field } = useModelField();
            const rules = useFieldEffectiveRules(field);
            const disabled = !rules.canEdit || rules.disabled;
            const Bind = getBind();

            const { values: options = [] } = field.predefinedValues || {
                options: []
            };

            const defaultOption = options.find(opt => opt.selected === true);

            return (
                <Bind defaultValue={defaultOption ? defaultOption.value : undefined}>
                    {({ onChange, value, ...bind }) => (
                        <Bind.ValidationContainer>
                            <RadioGroup
                                {...bind}
                                disabled={disabled}
                                label={field.label}
                                description={field.description}
                                note={field.note}
                                hint={field.help}
                                items={options.map(option => ({
                                    label: option.label,
                                    value: String(option.value),
                                    selected: option.selected
                                }))}
                                value={typeof value !== "undefined" ? String(value) : undefined}
                                onChange={value => {
                                    if (field.type === "number") {
                                        onChange(Number(value));
                                    } else {
                                        onChange(String(value));
                                    }
                                }}
                            />
                        </Bind.ValidationContainer>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
