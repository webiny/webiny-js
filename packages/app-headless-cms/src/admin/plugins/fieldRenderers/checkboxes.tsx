import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-checkboxes-buttons",
    renderer: {
        rendererName: "checkboxes",
        name: t`Checkboxes`,
        description: t`Renders checkboxes, allowing selection of multiple values.`,
        canUse({ field }) {
            return field.multipleValues && get(field, "predefinedValues.enabled");
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
                    <CheckboxGroup
                        label={I18NValue({ value: field.label })}
                        description={I18NValue({ value: field.helpText })}
                    >
                        {({ onChange, getValue }) => (
                            <React.Fragment>
                                {options.map((option, index) => (
                                    <div key={option.value + index}>
                                        <Checkbox
                                            label={option.label}
                                            value={getValue(option.value)}
                                            onChange={onChange(option.value)}
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        )}
                    </CheckboxGroup>
                </Bind>
            );
        }
    }
};

export default plugin;
