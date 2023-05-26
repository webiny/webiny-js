import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { AdvancedMultipleReferenceField } from "./components/AdvancedMultipleReferenceField";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createAdvancedMultipleRenderer = (): CmsEditorFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-multiple-advanced",
        renderer: {
            rendererName: "ref-advanced-multiple",
            name: t`Detailed view with modal search`,
            description: t`Renders a preview card of the selected record and the user searches through records using a modal window.`,
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
            }
        }
    };
};
