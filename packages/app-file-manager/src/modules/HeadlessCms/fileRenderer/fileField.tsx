import React from "react";
import styled from "@emotion/styled";
import { CmsModelFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { FileManager } from "@webiny/app-admin/components";
import { Typography } from "@webiny/ui/Typography";
import { File } from "./File";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl";

const ImageFieldWrapper = styled("div")({
    background: "var(--mdc-theme-on-background)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.42)",
    height: "100%",
    padding: "25px 15px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    span: {
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

const InnerImageFieldWrapper = styled("div")({
    background: "repeating-conic-gradient(#efefef 0% 25%, transparent 0% 50%) 50%/25px 25px",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    border: "1px solid var(--mdc-theme-background)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexBasis: "100%",
    maxHeight: "180px",
    ">div": {
        minWidth: "200px",
        maxHeight: "180px",
        padding: "30px"
    }
});

const t = i18n.ns("app-headless-cms/admin/fields/file");

export const singleFile: CmsModelFieldRendererPlugin = {
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
                <EditFileUsingUrl>
                    {({ editFile }) => (
                        <ImageFieldWrapper>
                            <Label>
                                <Typography use="body1" tag={"span"}>
                                    {field.label}
                                </Typography>
                            </Label>

                            <Bind>
                                {bind => {
                                    const { value, onChange } = bind;

                                    return (
                                        <InnerImageFieldWrapper>
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
                                                            onEdit={() => editFile(value)}
                                                            onRemove={() => onChange(null)}
                                                            showFileManager={selectFile}
                                                            placeholder={field.placeholderText}
                                                            description={field.helpText}
                                                            data-testid={`fr.input.filefield.${field.label}`}
                                                        />
                                                    );
                                                }}
                                            />
                                        </InnerImageFieldWrapper>
                                    );
                                }}
                            </Bind>
                        </ImageFieldWrapper>
                    )}
                </EditFileUsingUrl>
            );
        }
    }
};
