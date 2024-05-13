import React from "react";
import styled from "@emotion/styled";
import {
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types";
import { FileManager } from "@webiny/app-admin/components";
import { Typography } from "@webiny/ui/Typography";
import { File } from "./File";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const ImageFieldWrapper = styled("div")({
    background: "var(--mdc-theme-on-background)",
    borderBottom: "1px solid rgba(0, 0, 0, 0.42)",
    height: "100%",
    padding: "16px",
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
    margin: "16px 0 0",
    "> div": {
        minWidth: "200px",
        maxHeight: "180px",
        padding: "30px"
    }
});

const FieldRenderer = ({ field, getBind }: CmsModelFieldRendererProps) => {
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;
    return (
        <Bind>
            {bind => {
                const { value, onChange, validation } = bind;
                return (
                    <EditFileUsingUrl onSetFile={file => bind.onChange(file.src)}>
                        {({ editFile }) => (
                            <div>
                                <ImageFieldWrapper>
                                    <Typography use="body2" tag={"span"}>
                                        {field.label}
                                    </Typography>
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
                                                        data-testid={`fr.input.filefield.${field.label}`}
                                                    />
                                                );
                                            }}
                                        />
                                    </InnerImageFieldWrapper>
                                </ImageFieldWrapper>
                                {validation.isValid === false && (
                                    <FormElementMessage error>
                                        {validation.message || "Invalid value."}
                                    </FormElementMessage>
                                )}
                                {validation.isValid !== false && field.helpText && (
                                    <FormElementMessage>{field.helpText}</FormElementMessage>
                                )}
                            </div>
                        )}
                    </EditFileUsingUrl>
                );
            }}
        </Bind>
    );
};

export const singleFile: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-file",
    renderer: {
        rendererName: "file-input",
        name: "File Input",
        description: "Enables selecting a single file via File Manager.",
        canUse({ field }) {
            return field.type === "file" && !field.multipleValues;
        },
        render(params) {
            return <FieldRenderer {...params} />;
        }
    }
};
