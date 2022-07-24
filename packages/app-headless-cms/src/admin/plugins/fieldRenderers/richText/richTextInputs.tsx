import React, { useMemo } from "react";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "~/types";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import DynamicSection, { DynamicSectionPropsChildrenParams } from "../DynamicSection";
import { RichTextEditor, createPropsFromConfig } from "@webiny/app-admin/components/RichTextEditor";
import { IconButton } from "@webiny/ui/Button";
import { plugins } from "@webiny/plugins";
import styled from "@emotion/styled";

const t = i18n.ns("app-headless-cms/admin/fields/rich-text");

const getKey = (
    field: CmsEditorField,
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
    name: "cms-editor-field-renderer-rich-text-inputs",
    renderer: {
        rendererName: "rich-text-inputs",
        name: t`Rich Text Inputs`,
        description: t`Renders a simple list of rich text editors.`,
        canUse({ field }) {
            return (
                field.type === "rich-text" &&
                !!field.multipleValues &&
                !get(field, "predefinedValues.enabled")
            );
        },
        render(props) {
            const { field } = props;

            const rteProps = useMemo(() => {
                /**
                 * TODO @ts-refactor
                 * Missing cms-rte-config plugin.
                 */
                // @ts-ignore
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
                            <RichTextEditor
                                key={getKey(field, bind, index)}
                                {...rteProps}
                                {...bind.index}
                                label={`Value ${index + 1}`}
                                placeholder={field.placeholderText}
                                description={field.helpText}
                            />
                        </EditorWrapper>
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
