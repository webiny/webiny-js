import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CmsModelFieldRendererPlugin } from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { SimpleFormHeader } from "@webiny/app-admin/components/SimpleForm";
import { Grid, Cell } from "@webiny/ui/Grid";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { fieldsWrapperStyle } from "./StyledComponents";
import { FieldSettings } from "./FieldSettings";
import { ParentFieldProvider } from "~/admin/components/ContentEntryForm/ParentValue";
import { ParentValueIndexProvider } from "~/admin/components/ModelFieldProvider";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-object",
    renderer: {
        rendererName: "object",
        name: t`Inline Form`,
        description: t`Renders a set of fields.`,
        canUse({ field }) {
            return field.type === "object" && !field.multipleValues;
        },
        render({ field, getBind, contentModel }) {
            const Bind = getBind();

            const fieldSettings = FieldSettings.createFrom(field);

            if (!fieldSettings.hasFields()) {
                fieldSettings.logMissingFields();
                return null;
            }

            const settings = fieldSettings.getSettings();

            return (
                <Bind>
                    {bindProps => (
                        <ParentFieldProvider value={bindProps.value} path={Bind.parentName}>
                            <ParentValueIndexProvider index={-1}>
                                <Grid>
                                    <Cell span={12}>
                                        <SimpleFormHeader title={field.label} />
                                        {field.helpText && (
                                            <FormElementMessage>
                                                {field.helpText}
                                            </FormElementMessage>
                                        )}
                                    </Cell>
                                    <Cell span={12} className={fieldsWrapperStyle}>
                                        <Fields
                                            Bind={Bind}
                                            contentModel={contentModel}
                                            fields={settings.fields}
                                            layout={settings.layout}
                                        />
                                    </Cell>
                                </Grid>
                            </ParentValueIndexProvider>
                        </ParentFieldProvider>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
