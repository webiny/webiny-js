import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import {
    CmsEditorFieldPredefinedValuesEntry as Option,
    CmsEditorFieldRendererPlugin
} from "~/types";
import { Select } from "@webiny/ui/Select";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const getDefaultValue = (initialValue?: string | null, options?: Option[]): string | undefined => {
    if (initialValue) {
        return initialValue || undefined;
    } else if (!options) {
        return undefined;
    }
    const selected = options.find(option => !!option.selected);
    return selected ? selected.value : undefined;
};

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-select-box",
    renderer: {
        rendererName: "select-box",
        name: t`Select Box`,
        description: t`Renders a select box, allowing selection of a single value.`,
        canUse({ field }) {
            return !field.multipleValues && !!get(field, "predefinedValues.enabled");
        },
        render({ field, getBind }) {
            const Bind = getBind();

            const { values: options } = field.predefinedValues || {};

            return (
                <Bind>
                    {bind => {
                        const value = getDefaultValue(bind.value, options);
                        return (
                            <Select
                                {...bind}
                                value={value}
                                label={field.label}
                                description={field.helpText}
                                options={options}
                                data-testid={`fr.input.select.${field.label}`}
                            />
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
