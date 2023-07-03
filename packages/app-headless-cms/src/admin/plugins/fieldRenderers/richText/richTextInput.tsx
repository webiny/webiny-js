import React, { useMemo } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsContentEntry, CmsModelField, CmsEditorFieldRendererPlugin } from "~/types";
import { createPropsFromConfig, RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { plugins } from "@webiny/plugins";
import { BindComponentRenderProp } from "@webiny/form";
import { allowCmsLegacyRichTextInput } from "~/utils/allowCmsLegacyRichTextInput";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (
    field: CmsModelField,
    bind: BindComponentRenderProp<string, CmsContentEntry>
): string => {
    const formId = bind.form.data.id || "new";
    return `${formId}.${field.fieldId}`;
};

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text",
    isDisabled(field) {
        // When feature flag is set, plugin is always enabled.
        if (allowCmsLegacyRichTextInput) {
            return false;
        }

        // Plugin is enabled only when legacy RTE is used by the user
        // before introduction of lexical RTE.
        const isLegacyRichTextInput = field.renderer.name === "rich-text-input";
        const fieldModelIsUsed = !!field?.id;
        if (isLegacyRichTextInput && fieldModelIsUsed) {
            return false;
        }

        // This legacy plugin is disabled by default.
        return true;
    },
    renderer: {
        rendererName: "rich-text-input",
        name: t`Rich Text Input`,
        description: t`Renders a rich text editor.`,
        isDisabled(field) {
            const fieldModelIsUsed = !!field?.id;
            const isLegacyRichTextInput = field.renderer.name === "rich-text-input";
            const isLexicalInput = field.renderer.name === "lexical-text-input";

            // feature flag
            if (allowCmsLegacyRichTextInput) {
                // Legacy RTE will be allowed for selection only if lexical RTE is not used
                return isLexicalInput && fieldModelIsUsed;
            }

            // Allow renderer for selection only if legacy RTE is already used.
            if (isLegacyRichTextInput && fieldModelIsUsed) {
                return true;
            }

            // By default this renderer is disabled
            return true;
        },
        canUse({ field }) {
            return (
                field.type === "rich-text" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            const rteProps = useMemo(() => {
                /**
                 * TODO @ts-refactor
                 * Missing cms-rte-config plugin type.
                 */
                // @ts-ignore
                return createPropsFromConfig(plugins.byType("cms-rte-config").map(pl => pl.config));
            }, []);

            return (
                <Bind>
                    {bind => {
                        return (
                            <RichTextEditor
                                key={getKey(field, bind as any)}
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
