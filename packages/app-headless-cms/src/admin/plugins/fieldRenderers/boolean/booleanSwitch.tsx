import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Switch } from "@webiny/ui/Switch";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields/boolean");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-boolean",
    renderer: {
        rendererName: "boolean-input",
        name: t`Boolean Input`,
        description: t`Renders a simple switch button.`,
        canUse({ field }) {
            return (
                field.type === "boolean" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind, locale }) {
            const Bind = getBind();
            const { getValue } = useI18N();

            const label = getValue(field.label, locale);
            const helpText = getValue(field.helpText, locale);

            return (
                <Bind>
                    {bindProps => <Switch {...bindProps} label={label} description={helpText} />}
                </Bind>
            );
        }
    }
};

export default plugin;
