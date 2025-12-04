import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelFieldRendererPlugin } from "~/types.js";
import { Grid, Separator } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

export const createSeparatorFieldRenderer = (): CmsModelFieldRendererPlugin => {
    return {
        type: "cms-editor-field-renderer",
        name: "cms-editor-field-renderer-separator",
        renderer: {
            rendererName: "text-separator",
            name: t`Separator`,
            description: t`Renders a separator field.`,
            canUse({ field }) {
                return field.type === "text:separator";
            },
            render({ field }) {
                return (
                    <Grid>
                        <Grid.Column span={12}>
                            <Separator
                                variant={"strong"}
                                // this is the color from the figma
                                lineColor={"backgroundColor/backgroundColor-primary-default"}
                                alignContent={"center"}
                                content={
                                    <span className={"p-l-md p-r-md p-t-sm p-b-sm bg-color-white"}>
                                        {field.label}
                                    </span>
                                }
                            />
                            {field.label} ------------------------------
                        </Grid.Column>
                    </Grid>
                );
            }
        }
    };
};
