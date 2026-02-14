import React from "react";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { SimpleMultipleRenderer } from "./components/SimpleMultipleRenderer.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createSimpleMultipleRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-multiple-simple",
        renderer: {
            rendererName: "ref-simple-multiple",
            name: t`Checkboxes`,
            description: t`Renders a list of checkboxes and the user can select one or more records.`,
            canUse({ field }) {
                return field.type === "ref" && !!field.list;
            },
            render: props => {
                const { field, getBind } = props;

                const Bind = getBind();
                return (
                    <Bind>
                        {bind => (
                            <Bind.ValidationContainer>
                                <SimpleMultipleRenderer bind={bind} field={field} />
                            </Bind.ValidationContainer>
                        )}
                    </Bind>
                );
            }
        }
    };
};
