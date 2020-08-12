import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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

            const { getValue } = useI18N();

            const label = getValue(field.label, locale);
            const helpText = getValue(field.helpText, locale);

            return (
                <Bind>
                    <RadioGroup label={label} description={helpText}>
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
