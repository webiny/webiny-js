import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import SingleFile from "./SingleFile";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
const t = i18n.ns("app-headless-cms/admin/fields/date-time");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-file",
    renderer: {
        rendererName: "file-input",
        name: t`File Input`,
        description: t`Renders inputs for file.`,
        canUse({ field }) {
            return field.type === "file" && !field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind, Label }) {
            const Bind = getBind();

            return (
                <Grid>
                    <Cell span={12}>
                        <Label>
                            <I18NValue value={field.label} />
                        </Label>
                        <Bind>
                            {bind => <SingleFile field={field} bind={bind} />}
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
