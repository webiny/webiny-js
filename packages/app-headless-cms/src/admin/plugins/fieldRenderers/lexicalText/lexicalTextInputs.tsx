import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsModelField, CmsModelFieldRendererPlugin } from "~/types";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection, { DynamicSectionPropsChildrenParams } from "../DynamicSection";
import { IconButton } from "@webiny/ui/Button";
import styled from "@emotion/styled";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor";
import { modelHasLegacyRteField } from "~/admin/plugins/fieldRenderers/richText/utils";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (
    field: CmsModelField,
    bind: DynamicSectionPropsChildrenParams["bind"],
    index: number
): string => {
    const formId = bind.index.form?.data?.id || "new";
    return `${formId}.${field.fieldId}.${index}`;
};

const EditorWrapper = styled("div")({
    position: "relative",
    "> button": {
        position: "absolute",
        top: 0,
        right: 5,
        zIndex: 10
    }
});

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-lexical-inputs",
    renderer: {
        rendererName: "lexical-text-inputs",
        name: t`Lexical Text Inputs`,
        description: t`Renders a list of lexical editors.`,
        canUse({ field, model }) {
            const canUse =
                field.type === "rich-text" &&
                !!field.multipleValues &&
                !get(field, "predefinedValues.enabled");

            if (canUse && modelHasLegacyRteField(model)) {
                return false;
            }

            return canUse;
        },
        render(props) {
            const { field } = props;
            return (
                <DynamicSection {...props}>
                    {({ bind, index }) => (
                        <EditorWrapper>
                            <LexicalCmsEditor
                                value={bind.index.value}
                                onChange={bind.index.onChange}
                                key={getKey(field, bind, index)}
                                placeholder={field.placeholderText}
                            />
                            <FormElementMessage>{field.helpText}</FormElementMessage>
                            {index > 0 && (
                                <IconButton
                                    icon={<DeleteIcon />}
                                    onClick={() => bind.field.removeValue(index)}
                                />
                            )}
                        </EditorWrapper>
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
