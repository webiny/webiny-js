import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsContentEntry, CmsEditorFieldRendererPlugin, CmsModelField } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor";
import { modelHasLegacyRteField } from "~/admin/plugins/fieldRenderers/richText/utils";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

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
            const Bind = getBind<string, CmsContentEntry>();
            return (
                <Bind>
                    {bind => {
                        return (
                            <>
                                <Label>{field.label}</Label>
                                <LexicalCmsEditor
                                    value={bind.value}
                                    onChange={bind.onChange}
                                    key={getKey(field, bind)}
                                    placeholder={field.placeholderText}
                                    data-testid={`fr.input.lexical.${field.label}`}
                                />
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
