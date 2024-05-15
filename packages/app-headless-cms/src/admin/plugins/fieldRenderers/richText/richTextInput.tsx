import React, { useMemo } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { createPropsFromConfig, RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { plugins } from "@webiny/plugins";
import { useForm } from "@webiny/form";
import { CmsModelFieldRendererPlugin, CmsModelField } from "~/types";
import { allowCmsLegacyRichTextInput } from "~/utils/allowCmsLegacyRichTextInput";
import { modelHasLexicalField } from "~/admin/plugins/fieldRenderers/lexicalText/utils";
import {
    isLegacyRteFieldSaved,
    modelHasLegacyRteField
} from "~/admin/plugins/fieldRenderers/richText/utils";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (field: CmsModelField, id: string | undefined): string => {
    const formId = id || "new";
    return `${formId}.${field.fieldId}`;
};

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text",
    renderer: {
        rendererName: "rich-text-input",
        name: t`(Legacy) EditorJS Text Input`,
        description: t`Renders the legacy rich text editor.`,
        canUse({ field, model }) {
            const canUse =
                field.type === "rich-text" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled");

            if (canUse) {
                // Check for legacy RTE usage for saved and new field
                if (modelHasLexicalField(model)) {
                    return false;
                }

                if (!allowCmsLegacyRichTextInput) {
                    if (isLegacyRteFieldSaved(field) || modelHasLegacyRteField(model)) {
                        return true;
                    }
                    // When feature flag is disabled by default and legacy RTE will not be used
                    return false;
                }
            }

            return canUse;
        },
        render({ field, getBind }) {
            const form = useForm();
            const Bind = getBind();

            const rteProps = useMemo(() => {
                return createPropsFromConfig(plugins.byType("cms-rte-config").map(pl => pl.config));
            }, []);

            return (
                <Bind>
                    {bind => {
                        return (
                            <RichTextEditor
                                key={getKey(field, form.data.id)}
                                {...rteProps}
                                {...bind}
                                onChange={bind.onChange}
                                label={field.label}
                                placeholder={field.placeholderText}
                                description={field.helpText}
                                data-testid={`fr.input.richtext.${field.label}`}
                            />
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
