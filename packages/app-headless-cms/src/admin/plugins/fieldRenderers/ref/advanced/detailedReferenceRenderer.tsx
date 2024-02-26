import React from "react";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { AdvancedSingleReferenceField } from "./components/AdvancedSingleReferenceField";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createAdvancedSingleRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-single-advanced",
        renderer: {
            rendererName: "ref-advanced-single",
            name: t`Detailed view with modal search`,
            description: t`Renders a preview card of the selected record and the user searches through records using a modal window.`,
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
                                <AdvancedSingleReferenceField
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
