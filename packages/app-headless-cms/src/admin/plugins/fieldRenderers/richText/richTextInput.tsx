import React, { useMemo } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentEntry, CmsEditorField, CmsEditorFieldRendererPlugin } from "~/types";
import { createPropsFromConfig, RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { plugins } from "@webiny/plugins";
import { BindComponentRenderProp } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (
    field: CmsEditorField,
    bind: BindComponentRenderProp<string, CmsEditorContentEntry>
): string => {
    const formId = bind.form.data.id || "new";
    return `${formId}.${field.fieldId}`;
};

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
