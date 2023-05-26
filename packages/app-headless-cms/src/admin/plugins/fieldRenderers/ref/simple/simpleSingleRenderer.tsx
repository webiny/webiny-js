import React from "react";
import { CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { SimpleSingleRenderer } from "./components/SimpleSingleRenderer";

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
                return field.type === "ref" && !field.multipleValues;
            },
            render: props => {
                const { field, getBind } = props;

                const Bind = getBind();
                return (
                    <Bind>
                        {bind => {
                            return <SimpleSingleRenderer bind={bind} field={field} />;
                        }}
                    </Bind>
                );
            }
        }
    };
};
