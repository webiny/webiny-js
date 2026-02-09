import React, { useMemo } from "react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelFieldRendererPlugin, CmsModelField } from "~/types.js";
import { createLexicalStateTransformer } from "@webiny/lexical-converter";
import { useForm } from "@webiny/form";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor.js";
import { FormComponentDescription, DelayedOnChange } from "@webiny/admin-ui";
import { type RichTextValue, withHtml } from "./withHtml.js";

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
                !field.multipleValues,
                !get(field, "predefinedValues.enabled")
            ].every(Boolean);
        },
        render({ field, getBind, Label }) {
            const form = useForm();

            const transformer = useMemo(() => {
                return createLexicalStateTransformer();
            }, []);

            const Bind = getBind<RichTextValue>();
            return (
                <Bind>
                    {bind => {
                        return (
                            <Bind.ValidationContainer>
                                <Label>{field.label}</Label>
                                <FormComponentDescription text={field.helpText} />
                                <DelayedOnChange
                                    value={bind.value?.state}
                                    onChange={withHtml(transformer, bind.onChange)}
                                >
                                    {({ value, onChange }) => (
                                        <LexicalCmsEditor
                                            value={value}
                                            onChange={onChange}
                                            key={getKey(form.data.id, field)}
                                            placeholder={field.placeholderText}
                                            data-testid={`fr.input.lexical.${field.label}`}
                                        />
                                    )}
                                </DelayedOnChange>
                            </Bind.ValidationContainer>
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
