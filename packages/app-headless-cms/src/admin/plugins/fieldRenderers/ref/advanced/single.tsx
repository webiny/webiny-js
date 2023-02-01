import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { AdvancedReferenceField } from "./components/AdvancedReferenceField";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createAdvancedSingleRenderer = (): CmsEditorFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-single-advanced",
        renderer: {
            rendererName: "ref-advanced-single",
            name: t`Advanced Reference Input`,
            description: t`Renders a advanced reference selection, allowing selection of a single entry.`,
            canUse({ field }) {
                return field.type === "ref" && !field.multipleValues;
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
