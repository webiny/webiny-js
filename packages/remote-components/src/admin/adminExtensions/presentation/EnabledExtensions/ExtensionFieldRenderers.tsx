import React from "react";
import { useFeature } from "@webiny/app";
import { AdminConfig } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { EnabledExtensionsFeature } from "./feature.js";

/**
 * Gives the form a component for every enabled field renderer extension. The CMS catalogue entry,
 * which makes the Appearance tab offer it, is kept in step by the presenter.
 */
export const ExtensionFieldRenderers = createReactiveComponent(function ExtensionFieldRenderers() {
    const { presenter } = useFeature(EnabledExtensionsFeature);

    const { fieldRenderers } = presenter.vm;
    if (fieldRenderers.length === 0) {
        return null;
    }

    return (
        <AdminConfig>
            {fieldRenderers.map(renderer => (
                <AdminConfig.Form.FieldRenderer
                    key={renderer.formRendererName}
                    name={renderer.formRendererName}
                    component={renderer.component}
                />
            ))}
        </AdminConfig>
    );
});
