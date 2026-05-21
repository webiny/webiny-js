import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { FormComponentDescription, FormComponentLabel, FormComponentNote } from "@webiny/admin-ui";
import type { CmsModelField, CmsModelFieldRendererPlugin } from "~/types.js";
import { useForm } from "@webiny/form";
import { LexicalEditor } from "~/admin/components/LexicalCmsEditor/LexicalEditor.js";
import { useFieldEffectiveRules, useModelField } from "@webiny/app-headless-cms-common";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (id: string | undefined, field: CmsModelField): string => {
    const formId = id || "new";
    return `${formId}.${field.fieldId}`;
};

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-lexical",
    renderer: {
        rendererName: "lexical-text-input",
        name: t`Lexical Text Input`,
        description: t`Renders a lexical text editor.`,
        canUse({ field }) {
            return [
                field.type === "rich-text",
                !field.list,
                !field.predefinedValues?.enabled
            ].every(Boolean);
        },
        render({ getBind }) {
            const { field } = useModelField();
            const rules = useFieldEffectiveRules(field);
            const form = useForm();

            const Bind = getBind();

            const disabled = !rules.canEdit || rules.disabled;

            return (
                <Bind>
                    {bind => {
                        return (
                            <Bind.ValidationContainer>
                                <FormComponentLabel
                                    text={field.label}
                                    hint={field.help}
                                    disabled={disabled}
                                />
                                <FormComponentDescription
                                    text={field.description}
                                    disabled={disabled}
                                />
                                <LexicalEditor
                                    disabled={disabled}
                                    value={bind.value}
                                    onChange={bind.onChange}
                                    key={getKey(form.data.id, field)}
                                    placeholder={field.placeholder}
                                    data-testid={`fr.input.lexical.${field.label}`}
                                />
                                {field.note ? (
                                    <FormComponentNote text={field.note} disabled={disabled} />
                                ) : null}
                            </Bind.ValidationContainer>
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
