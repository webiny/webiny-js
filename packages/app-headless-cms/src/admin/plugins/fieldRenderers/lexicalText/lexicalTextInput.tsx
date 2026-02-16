import React from "react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { FormComponentLabel } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import type { CmsModelFieldRendererPlugin, CmsModelField } from "~/types.js";
import { useForm } from "@webiny/form";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor.js";

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
                !get(field, "predefinedValues.enabled")
            ].every(Boolean);
        },
        render({ field, getBind }) {
            const form = useForm();

            const Bind = getBind();

            return (
                <Bind>
                    {bind => {
                        return (
                            <Bind.ValidationContainer>
                                <FormComponentLabel text={field.label} hint={field.help} />
                                <FormComponentDescription text={field.description} />
                                <LexicalCmsEditor
                                    value={bind.value}
                                    onChange={bind.onChange}
                                    key={getKey(form.data.id, field)}
                                    placeholder={field.placeholder}
                                    data-testid={`fr.input.lexical.${field.label}`}
                                />
                                {field.note ? <FormComponentNote text={field.note} /> : null}
                            </Bind.ValidationContainer>
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
