import React, { useMemo } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/close.svg";
import DynamicListMultipleValues from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/DynamicListMultipleValues";
import { RichTextEditor, createPropsFromConfig } from "@webiny/app-admin/components/RichTextEditor";
import { plugins } from "@webiny/plugins";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (field, bind, index) => {
    const formId = bind.index.form.state.data.id || "new";
    return `${formId}.${field.fieldId}.${index}`;
};

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
            const { field } = props;

            const rteProps = useMemo(() => {
                return createPropsFromConfig(plugins.byType("cms-rte-config").map(pl => pl.config));
            }, []);

            return (
                <DynamicListMultipleValues {...props}>
                    {({ bind, index }) => (
                        <RichTextEditor
                            key={getKey(field, bind, index)}
                            {...rteProps}
                            {...bind.index}
                            label={`Value ${index + 1}`}
                            placeholder={field.placeholderText}
                            description={field.helpText}
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
