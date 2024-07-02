import React from "react";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { AdvancedMultipleReferenceField } from "./components/AdvancedMultipleReferenceField";
import { AdvancedMultipleReferenceSettings } from "./components/AdvancedMultipleReferenceSettings";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createAdvancedMultipleRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-multiple-advanced",
        renderer: {
            rendererName: "ref-advanced-multiple",
            name: t`Detailed view with modal search`,
            description: t`Renders preview cards of the selected records. User can browse through records using a modal dialog.`,
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
                                <AdvancedMultipleReferenceField
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
            },
            renderSettings: () => {
                return <AdvancedMultipleReferenceSettings />;
            }
        }
    };
};
