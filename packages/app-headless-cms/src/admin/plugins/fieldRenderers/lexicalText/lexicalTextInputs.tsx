import React, { useMemo } from "react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelField, CmsModelFieldRendererPlugin } from "~/types.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import DynamicSection from "../DynamicSection.js";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor.js";
import { useForm } from "@webiny/form";
import { MultiValueRendererSettings } from "~/admin/plugins/fieldRenderers/MultiValueRendererSettings.js";
import { FormComponentNote, DelayedOnChange, IconButton } from "@webiny/admin-ui";
import { withHtml } from "~/admin/plugins/fieldRenderers/lexicalText/withHtml.js";
import { createLexicalStateTransformer } from "@webiny/lexical-converter";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (id: string | undefined, field: CmsModelField, index: number): string => {
    const formId = id || "new";
    return `${formId}.${field.fieldId}.${index}`;
};

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-lexical-inputs",
    renderer: {
        rendererName: "lexical-text-inputs",
        name: t`Lexical Text Inputs`,
        description: t`Renders a list of lexical editors.`,
        canUse({ field }) {
            return [
                field.type === "rich-text",
                !!field.multipleValues,
                !get(field, "predefinedValues.enabled")
            ].every(Boolean);
        },
        render(props) {
            const { field } = props;
            const form = useForm();

            const transformer = useMemo(() => {
                return createLexicalStateTransformer();
            }, []);

            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => (
                        <div className={"relative"}>
                            <DelayedOnChange
                                value={bind.index.value.state}
                                onChange={withHtml(transformer, bind.index.onChange)}
                            >
                                {({ value, onChange }) => (
                                    <LexicalCmsEditor
                                        value={value}
                                        onChange={onChange}
                                        key={getKey(form.data.id, field, index)}
                                        placeholder={field.placeholderText}
                                    />
                                )}
                            </DelayedOnChange>
                            {field.multipleValues ? null : (
                                <FormComponentNote text={field.helpText} />
                            )}
                            <div className={"absolute top-sm right-sm z-10"}>
                                <IconButton
                                    variant={"ghost"}
                                    size={"md"}
                                    icon={<DeleteIcon />}
                                    onClick={() => bind.field.removeValue(index)}
                                />
                            </div>
                        </div>
                    )}
                </DynamicSection>
            );
        },
        renderSettings(props) {
            return <MultiValueRendererSettings {...props} />;
        }
    }
};

export default plugin;
