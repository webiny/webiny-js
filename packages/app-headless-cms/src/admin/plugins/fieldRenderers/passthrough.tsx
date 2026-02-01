import React from "react";
import { Fields } from "@webiny/app-headless-cms-common";
import type { CmsModelFieldRendererPlugin } from "~/types.js";

export const passthroughFieldRenderer: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-passthrough",
    renderer: {
        rendererName: "passthrough",
        name: "Passthrough Renderer",
        description: `Render child fields without any extra wrappers.`,
        canUse() {
            return false;
        },
        render({ field, contentModel, getBind }) {
            const Bind = getBind();
            return (
                <Fields
                    Bind={Bind}
                    contentModel={contentModel}
                    fields={field.settings?.fields ?? []}
                    layout={field.settings?.layout ?? []}
                />
            );
        }
    }
};
