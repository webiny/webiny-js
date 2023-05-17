import React from "react";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { SimpleMultipleRenderer } from "./components/SimpleMultipleRenderer";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createSimpleMultipleRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-multiple-simple",
        renderer: {
            rendererName: "ref-simple-multiple",
            name: t`Simple checkbox list`,
            description: t`Renders a list of checkboxes and the user can select multiple related records.`,
            canUse({ field }) {
                return field.type === "ref" && !!field.multipleValues;
            },
            render: props => {
                const { field, getBind } = props;

                const Bind = getBind();
                return (
                    <Bind>
                        {bind => {
                            return <SimpleMultipleRenderer bind={bind} field={field} />;
                        }}
                    </Bind>
                );
            }
        }
    };
};
