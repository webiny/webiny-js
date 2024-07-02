import React, { useMemo } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsModelField, CmsModelFieldRendererPlugin } from "~/types";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection from "../DynamicSection";
import { createPropsFromConfig, RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { IconButton } from "@webiny/ui/Button";
import { plugins } from "@webiny/plugins";
import styled from "@emotion/styled";
import { allowCmsLegacyRichTextInput } from "~/utils/allowCmsLegacyRichTextInput";
import { modelHasLexicalField } from "~/admin/plugins/fieldRenderers/lexicalText/utils";
import {
    isLegacyRteFieldSaved,
    modelHasLegacyRteField
} from "~/admin/plugins/fieldRenderers/richText/utils";
import { useForm } from "@webiny/form";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (field: CmsModelField, id: string | undefined, index: number): string => {
    const formId = id || "new";
    return `${formId}.${field.fieldId}.${index}`;
};

const emptyValue: Record<string, any>[] = [
    {
        type: "paragraph",
        data: {
            textAlign: "left",
            className: null,
            text: ""
        }
    }
];

const EditorWrapper = styled("div")({
    position: "relative",
    "> button": {
        position: "absolute",
        top: 5,
        right: 5
    }
});

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-rich-text-inputs",
    renderer: {
        rendererName: "rich-text-inputs",
        name: t`(Legacy) EditorJS Text Inputs`,
        description: t`Renders a simple list of legacy rich text editors.`,
        canUse({ field, model }) {
            const canUse =
                field.type === "rich-text" &&
                !!field.multipleValues &&
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
        render(props) {
            const form = useForm();
            const { field } = props;

            const rteProps = useMemo(() => {
                return createPropsFromConfig(plugins.byType("cms-rte-config").map(pl => pl.config));
            }, []);

            return (
                <DynamicSection {...props} emptyValue={emptyValue}>
                    {({ bind, index }) => (
                        <EditorWrapper>
                            {index > 0 && (
                                <IconButton
                                    icon={<DeleteIcon />}
                                    onClick={() => bind.field.removeValue(index)}
                                />
                            )}
                            <DelayedOnChange {...bind.index}>
                                <RichTextEditor
                                    key={getKey(field, form.data.id, index)}
                                    {...rteProps}
                                    label={`Value ${index + 1}`}
                                    placeholder={field.placeholderText}
                                    description={field.helpText}
                                />
                            </DelayedOnChange>
                        </EditorWrapper>
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
