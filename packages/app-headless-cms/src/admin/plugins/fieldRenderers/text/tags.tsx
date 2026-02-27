import React from "react";
import { Tags } from "@webiny/admin-ui";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { useModelField } from "@webiny/app-headless-cms-common";

export const tags: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-tags",
    renderer: {
        rendererName: "tags",
        name: "Tags",
        description: `Renders a tags component.`,
        canUse({ field }) {
            return field.type === "text" && field.list === true && !field.predefinedValues?.enabled;
        },
        render({ getBind }) {
            const { field, permissions } = useModelField();
            const Bind = getBind();

            return (
                <Bind defaultValue={[]}>
                    {props => {
                        return (
                            <Bind.ValidationContainer>
                                <Tags
                                    disabled={!permissions.canEdit}
                                    label={field.label}
                                    placeholder={field.placeholder || "Add values"}
                                    description={field.description}
                                    note={field.note}
                                    hint={field.help}
                                    {...props}
                                />
                            </Bind.ValidationContainer>
                        );
                    }}
                </Bind>
            );
        }
    }
};
