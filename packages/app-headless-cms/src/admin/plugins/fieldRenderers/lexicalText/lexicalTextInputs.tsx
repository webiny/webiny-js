import React from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsModelField, CmsEditorFieldRendererPlugin } from "~/types";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection, { DynamicSectionPropsChildrenParams } from "../DynamicSection";
import { IconButton } from "@webiny/ui/Button";
import styled from "@emotion/styled";
import { LexicalCmsEditor } from "~/admin/components/LexicalCmsEditor/LexicalCmsEditor";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (
    field: CmsModelField,
    bind: DynamicSectionPropsChildrenParams["bind"],
    index: number
): string => {
    const formId = bind.index.form?.data?.id || "new";
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

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-lexical-inputs",
    renderer: {
        rendererName: "lexical-inputs",
        name: t`Lexical Inputs`,
        description: t`Renders a simple list of lexical editors.`,
        canUse({ field }) {
            return (
                field.type === "rich-text" &&
                !!field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            const { field } = props;
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
                            <LexicalCmsEditor
                                value={bind.field.value}
                                onChange={bind.field.onChange}
                                key={getKey(field, bind, index)}
                                placeholder={field.placeholderText}
                            />
                        </EditorWrapper>
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
