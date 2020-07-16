import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";
import I18NRichTextEditor from "@webiny/app-i18n/admin/components/I18NRichTextEditor";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/close.svg";
import get from "lodash/get";
import DynamicListMultipleValues from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/DynamicListMultipleValues";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text-inputs",
    renderer: {
        rendererName: "rich-text-inputs",
        name: t`Rich Text Inputs`,
        description: t`Renders a simple list of rich text editors.`,
        canUse({ field }) {
            return (
                field.type === "rich-text" &&
                field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            const { field, locale } = props;
            const { getValue } = useI18N();

            const placeholderText = getValue(field.placeholderText, locale);
            const helpText = getValue(field.helpText, locale);

            return (
                <DynamicListMultipleValues {...props}>
                    {({ bind, index }) => (
                        <I18NRichTextEditor
                            {...bind.index}
                            label={I18NValue({ value: `Value ${index + 1}` })}
                            placeholder={placeholderText}
                            description={helpText}
                            trailingIcon={
                                index > 0 && {
                                    icon: <DeleteIcon />,
                                    onClick: bind.index.removeValue
                                }
                            }
                        />
                    )}
                </DynamicListMultipleValues>
            );
        }
    }
};

export default plugin;
