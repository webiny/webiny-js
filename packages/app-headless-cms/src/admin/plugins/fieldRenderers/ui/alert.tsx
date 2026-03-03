import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { Alert, type AlertProps, Grid } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

export const createAlertFieldRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ui-alert",
        renderer: {
            rendererName: "uiAlert",
            name: t`Alert`,
            description: t`Renders an alert field.`,
            canUse({ field }) {
                return field.type === "ui" || field.type === "ui:alert";
            },
            render({ field }) {
                const type = (field.settings?.type || "info") as AlertProps["type"];
                return (
                    <Grid>
                        <Grid.Column span={12}>
                            <Alert type={type}>
                                {field.description || field.help || field.label}
                            </Alert>
                        </Grid.Column>
                    </Grid>
                );
            }
        }
    };
};
