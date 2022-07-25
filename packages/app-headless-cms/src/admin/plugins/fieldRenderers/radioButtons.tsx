import React from "react";
import get from "lodash/get";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Radio, RadioGroup } from "@webiny/ui/Radio";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-radio-buttons",
    renderer: {
        rendererName: "radio-buttons",
        name: t`Radio Buttons`,
        description: t`Renders radio buttons, allowing selection of a single value.`,
        canUse({ field }) {
            return !field.multipleValues && !!get(field, "predefinedValues.enabled");
        },
        render({ field, getBind }) {
            const Bind = getBind();

            const { values: options = [] } = field.predefinedValues || {
                options: []
            };

            return (
                <Bind>
                    <RadioGroup label={field.label} description={field.helpText}>
                        {({ onChange, getValue }) => (
                            <React.Fragment>
                                {options.map((option, index) => {
                                    const value =
                                        field.type === "number"
                                            ? Number(option.value)
                                            : option.value;
                                    return (
                                        <div key={String(option.value) + index}>
                                            <Radio
                                                label={option.label}
                                                value={getValue(value)}
                                                onChange={onChange(value)}
                                                data-testid={`fr.input.${field.label}.${option.label}`}
                                            />
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        )}
                    </RadioGroup>
                </Bind>
            );
        }
    }
};

export default plugin;
