import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import I18NRichTextEditor from "@webiny/app-i18n/admin/components/I18NRichTextEditor";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text",
    renderer: {
        rendererName: "rich-text-input",
        name: t`Rich Text Input`,
        description: t`Renders a rich text editor.`,
        canUse({ field }) {
            return (
                field.type === "rich-text" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind, locale }) {
            const Bind = getBind();
            const { getValue } = useI18N();

            const label = getValue(field.label, locale);
            const placeholderText = getValue(field.placeholderText, locale);
            const helpText = getValue(field.helpText, locale);

            return (
                <Bind>
                    {bind => (
                        <I18NRichTextEditor
                            {...bind}
                            onChange={bind.onChange}
                            label={label}
                            placeholder={placeholderText}
                            description={helpText}
                        />
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
