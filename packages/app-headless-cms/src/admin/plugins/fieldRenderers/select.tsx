import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-select-box",
    renderer: {
        rendererName: "select-box",
        name: t`Select Box`,
        description: t`Renders a select box, allowing selection of a single value.`,
        canUse({ field }) {
            return !field.multipleValues && get(field, "predefinedValues.enabled");
        },
        render({ field, getBind, locale }) {
            const Bind = getBind();

            const valuesItem = field.predefinedValues.values.values.find(
                item => item.locale === locale
            );

            const options = valuesItem && Array.isArray(valuesItem.value) ? valuesItem.value : [];

            const { getValue } = useI18N();

            const label = getValue(field.label, locale);
            const helpText = getValue(field.helpText, locale);

            return (
                <Bind>
                    <Select label={label} description={helpText} options={options} />
                </Bind>
            );
        }
    }
};

export default plugin;
