import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { Grid, Separator } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

export const createSeparatorFieldRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-ui-separator",
        renderer: {
            rendererName: "uiSeparator",
            name: t`Separator`,
            description: t`Renders a separator field.`,
            canUse({ field }) {
                return field.type === "ui:separator";
            },
            render({ field }) {
                return (
                    <Grid>
                        <Grid.Column span={12}>
                            <Separator variant={"accent"}>{field.label}</Separator>
                        </Grid.Column>
                    </Grid>
                );
            }
        }
    };
};
