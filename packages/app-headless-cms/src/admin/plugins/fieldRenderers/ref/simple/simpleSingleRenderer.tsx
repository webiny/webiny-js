import React from "react";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { SimpleSingleRenderer } from "./components/SimpleSingleRenderer.js";

const t = i18n.ns("app-headless-cms/admin/fields/ref");

export const createSimpleSingleRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ref-single-simple",
        renderer: {
            rendererName: "ref-simple-single",
            name: t`Simple checkbox list`,
            description: t`Renders a list of checkboxes and the user can select one related record.`,
            canUse({ field }) {
                return field.type === "ref" && !field.list;
            },
            render: props => {
                const { field, getBind } = props;

                const Bind = getBind();
                return (
                    <Bind>
                        {bind => (
                            <Bind.ValidationContainer>
                                <SimpleSingleRenderer bind={bind} field={field} />
                            </Bind.ValidationContainer>
                        )}
                    </Bind>
                );
            }
        }
    };
};
