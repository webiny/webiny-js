import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { FileManager } from "@webiny/app-admin/components";
import File from "./File";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

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

            return (
                <Grid>
                    <Cell span={12}>
                        <Label>{field.label}</Label>
                        <Bind>
                            {({ value, onChange }) => (
                                <FileManager multiple={false}>
                                    {({ showFileManager }) => {
                                        const selectFile = () => {
                                            showFileManager(newFile => {
                                                if (newFile !== null) {
                                                    onChange(newFile.src);
                                                }
                                            });
                                        };

                                        return (
                                            <File
                                                url={value}
                                                onRemove={() => onChange(null)}
                                                showFileManager={selectFile}
                                                placeholder={t`Select a file"`}
                                            />
                                        );
                                    }}
                                </FileManager>
                            )}
                        </Bind>
                        {field.helpText && (
                            <FormElementMessage>{field.helpText}</FormElementMessage>
                        )}
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
