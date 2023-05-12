import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { FileManager } from "@webiny/app-admin/components";
import File from "./File";

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
        render({ field, getBind, Label }) {
            const Bind = getBind();

            const imagesOnly = field.settings && field.settings.imagesOnly;
            return (
                <Grid>
                    <Cell span={12}>
                        <Label>{field.label}</Label>
                        <Bind>
                            {bind => {
                                const { value, onChange } = bind;

                                return (
                                    <FileManager
                                        images={imagesOnly}
                                        render={({ showFileManager }) => {
                                            const selectFile = () => {
                                                showFileManager(file => onChange(file.src));
                                            };
                                            return (
                                                <File
                                                    {...bind}
                                                    url={value}
                                                    onRemove={() => onChange(null)}
                                                    showFileManager={selectFile}
                                                    placeholder={field.placeholderText}
                                                    description={field.helpText}
                                                    data-testid={`fr.input.filefield.${field.label}`}
                                                />
                                            );
                                        }}
                                    />
                                );
                            }}
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
