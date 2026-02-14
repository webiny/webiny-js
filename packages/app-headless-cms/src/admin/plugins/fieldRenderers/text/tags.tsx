import React from "react";
import { Tags } from "@webiny/ui/Tags/index.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";

export const tags: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-tags",
    renderer: {
        rendererName: "tags",
        name: "Tags",
        description: `Renders a tags component.`,
        canUse({ field }) {
            return (
                field.type === "text" &&
                field.list === true &&
                !field.predefinedValues?.enabled
            );
        },
        render({ field, getBind }) {
            const Bind = getBind();

            return (
                <Bind defaultValue={[]}>
                    {props => {
                        return (
                            <Bind.ValidationContainer>
                                <Tags
                                    label={field.label}
                                    placeholder={field.placeholder || "Add values"}
                                    description={field.description}
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
