import React from "react";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { FileManager } from "@webiny/app-admin/components";
import File from "./File";
import { FileItem } from "@webiny/app-admin/components/FileManager/types";

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
                                    <FileManager multiple={false} images={imagesOnly}>
                                        {({ showFileManager }) => {
                                            const selectFile = () => {
                                                showFileManager((newFile: FileItem) => {
                                                    if (newFile === null) {
                                                        return;
                                                    }
                                                    onChange(newFile.src);
                                                });
                                            };
                                            return (
                                                <File
                                                    {...bind}
                                                    url={value}
                                                    onRemove={() => onChange(null)}
                                                    showFileManager={selectFile}
                                                    placeholder={field.placeholderText}
                                                    description={field.helpText}
                                                />
                                            );
                                        }}
                                    </FileManager>
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
