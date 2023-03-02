import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { AdvancedReferenceField } from "./components/AdvancedReferenceField";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createAdvancedMultipleRenderer = (): CmsEditorFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-multiple-advanced",
        renderer: {
            rendererName: "ref-advanced-multiple",
            name: t`Advanced References Input`,
            description: t`Renders a advanced references selection, allowing selection of multiple entries.`,
            canUse({ field }) {
                return field.type === "ref" && !!field.multipleValues;
            },
            render: props => {
                const { field, getBind, Label, contentModel } = props;

                const Bind = getBind();
                return (
                    <Bind>
                        {bind => {
                            return (
                                <AdvancedReferenceField
                                    field={field}
                                    getBind={getBind}
                                    bind={bind}
                                    Label={Label}
                                    contentModel={contentModel}
                                />
                            );
                        }}
                    </Bind>
                );
            }
        }
    };
};
