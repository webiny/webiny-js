import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import SingleFile from "./SingleFile";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
const t = i18n.ns("app-headless-cms/admin/fields/file");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-file",
    renderer: {
        rendererName: "file-input",
        name: t`File Input`,
        description: t`Enables selecting a single file via File Manager.`,
        canUse({ field }) {
            return field.type === "file" && !field.multipleValues;
        },
        render({ field, getBind, Label, locale }) {
            const Bind = getBind();
            const { getValue } = useI18N();

            const label = getValue(field.label, locale);
            const helpText = getValue(field.helpText, locale);

            return (
                <Grid>
                    <Cell span={12}>
                        <Label>{label}</Label>
                        <Bind>
                            {bind => (
                                <SingleFile field={field} bind={bind} description={helpText} />
                            )}
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
