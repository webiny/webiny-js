import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { SimpleFormHeader } from "@webiny/app-admin/components/SimpleForm";
import { Grid, Cell } from "@webiny/ui/Grid";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-object",
    renderer: {
        rendererName: "object",
        name: t`Object`,
        description: t`Renders a set of fields.`,
        canUse({ field }) {
            return field.type === "object" && !field.multipleValues;
        },
        render({ field, getBind, contentModel }) {
            const Bind = getBind();

            return (
                <Grid>
                    <Cell span={12}>
                        <SimpleFormHeader title={field.label} />
                    </Cell>
                    <Cell span={12} style={{ paddingBottom: 15 }}>
                        <Fields
                            Bind={Bind}
                            contentModel={contentModel}
                            fields={field.settings.fields}
                            layout={field.settings.layout}
                        />
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
