import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsModelFieldRendererPlugin, CmsModelField } from "~/types";
import { useForm } from "@webiny/form";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor";
import { modelHasLegacyRteField } from "~/admin/plugins/fieldRenderers/richText/utils";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

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
        canUse({ field, model }) {
            const canUse =
                field.type === "rich-text" &&
                !field.multipleValues &&
                !get(field, "predefinedValues.enabled");

            if (canUse && modelHasLegacyRteField(model)) {
                return false;
            }

            return canUse;
        },
        render({ field, getBind, Label }) {
            const form = useForm();
            const Bind = getBind<string>();
            return (
                <Bind>
                    {bind => {
                        return (
                            <>
                                <Label>{field.label}</Label>
                                <DelayedOnChange {...bind}>
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
                                <FormElementMessage>{field.helpText}</FormElementMessage>
                            </>
                        );
                    }}
                </Bind>
            );
        }
    }
};

export default plugin;
