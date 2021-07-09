import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorFieldRendererPlugin } from "~/types";
import DynamicSection from "../DynamicSection";
import { Cell, Grid } from "@webiny/ui/Grid";
import { SimpleFormHeader } from "@webiny/app-admin/components/SimpleForm";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import { IconButton } from "@webiny/ui/Button";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-objects",
    renderer: {
        rendererName: "objects",
        name: t`Objects`,
        description: t`Renders a set of fields.`,
        canUse({ field }) {
            return field.type === "object" && field.multipleValues;
        },
        render(props) {
            const { field, contentModel } = props;

            return (
                <DynamicSection {...props} emptyValue={{}} showLabel={false}>
                    {({ Bind, bind, index }) => (
                        <Grid>
                            <Cell span={12}>
                                <SimpleFormHeader title={`${props.field.label} #${index + 1}`}>
                                    {index > 0 && (
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            onClick={() => bind.field.removeValue(index)}
                                        />
                                    )}
                                </SimpleFormHeader>
                            </Cell>
                            <Cell
                                span={12}
                                style={{
                                    borderLeft: "2px solid var(--mdc-theme-primary)",
                                    paddingLeft: 10
                                }}
                            >
                                <Fields
                                    Bind={Bind}
                                    {...bind.index}
                                    contentModel={contentModel}
                                    fields={field.settings.fields}
                                    layout={field.settings.layout}
                                />
                            </Cell>
                        </Grid>
                    )}
                </DynamicSection>
            );
        }
    }
};

export default plugin;
