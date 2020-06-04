import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-radio-buttons",
    renderer: {
        rendererName: "radio-buttons",
        name: t`Radio Buttons`,
        description: t`Renders radio buttons, allowing selection of a single value.`,
        canUse({ field }) {
            return !field.multipleValues && get(field, "predefinedValues.enabled");
        },
        render({ field, getBind, locale }) {
            const Bind = getBind();

            const valuesItem = field.predefinedValues.values.values.find(
                item => item.locale === locale
            );
            let options = [];
            if (valuesItem) {
                options = Array.isArray(valuesItem.value) ? valuesItem.value : [];
            }

            return (
                <Bind>
                    <RadioGroup
                        label={I18NValue({ value: field.label })}
                        description={I18NValue({ value: field.helpText })}
                    >
                        {({ onChange, getValue }) => (
                            <React.Fragment>
                                {options.map((option, index) => (
                                    <div key={option.value + index}>
                                        <Radio
                                            label={option.label}
                                            value={getValue(option.value)}
                                            onChange={onChange(option.value)}
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        )}
                    </RadioGroup>
                </Bind>
            );
        }
    }
};

export default plugin;
