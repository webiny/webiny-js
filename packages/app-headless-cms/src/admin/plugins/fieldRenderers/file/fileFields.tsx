import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import MultipleFile from "./MultipleFile";

const t = i18n.ns("app-headless-cms/admin/fields/date-time");

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-files",
    renderer: {
        rendererName: "file-inputs",
        name: t`File Inputs`,
        description: t`Renders a list of file inputs.`,
        canUse({ field }) {
            return field.type === "file" && field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind, Label }) {
            const Bind = getBind();
            const FirstFieldBind = getBind(0);

            return (
                <Bind>
                    {({ appendValue, value }) => (
                        <Grid>
                            <Cell span={12}>
                                <Label>
                                    <I18NValue value={field.label} />
                                </Label>
                                <FirstFieldBind>
                                    {bind => (
                                        <MultipleFile field={field} bind={bind} appendValue={appendValue} removeValue={bind.removeValue} />
                                    )}
                                </FirstFieldBind>
                            </Cell>

                            {value.slice(1).map((item, index) => {
                                const Bind = getBind(index + 1);
                                return (
                                    <Cell span={12} key={index + 1}>
                                        <Bind>
                                            {bind => (
                                                <MultipleFile field={field} bind={bind} appendValue={appendValue} removeValue={bind.removeValue} />
                                            )}
                                        </Bind>
                                    </Cell>
                                );
                            })}
                        </Grid>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
