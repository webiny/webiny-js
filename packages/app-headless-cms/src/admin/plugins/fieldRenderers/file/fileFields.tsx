import React from "react";
import dotProp from "dot-prop-immutable";
import { CmsModelField, CmsModelFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, GridInner } from "@webiny/ui/Grid";
import { imageWrapperStyles } from "./utils";
import { FileManager } from "@webiny/app-admin/components";
import styled from "@emotion/styled";
import File from "./File";
import { GetBindCallable } from "~/admin/components/ContentEntryForm/useBind";

const t = i18n.ns("app-headless-cms/admin/fields/file");

const FileUploadWrapper = styled("div")({
    position: "relative",
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    ".mdc-text-field-helper-text": {
        color: "var(--mdc-theme-text-secondary-on-background)"
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
    padding: "30px",
    ">div": {
        maxHeight: "180px",
        img: {
            padding: "15px"
        }
    }
});

interface FieldRendererProps {
    getBind: GetBindCallable;
    Label: React.ComponentType<React.PropsWithChildren>;
    field: CmsModelField;
}
const FieldRenderer = ({ getBind, Label, field }: FieldRendererProps) => {
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;

    return (
        <Bind>
            {bind => {
                const { onChange } = bind;

                // We need to make sure the value is an array, since this is a multi-value component.
                const value: string[] = (
                    Array.isArray(bind.value) ? bind.value : [bind.value]
                ).filter(Boolean);

                return (
                    <FileUploadWrapper className={imageWrapperStyles}>
                        <FileManager
                            multiple
                            images={imagesOnly}
                            render={({ showFileManager }) => {
                                const selectFiles = (index = -1) => {
                                    showFileManager(files => {
                                        const urls = files.map(f => f.src);
                                        if (index === -1) {
                                            onChange([...value, ...urls]);
                                        } else {
                                            onChange([
                                                ...value.slice(0, index),
                                                ...urls,
                                                ...value.slice(index + 1)
                                            ]);
                                        }
                                    });
                                };
                                return (
                                    <GridInner>
                                        <Cell span={12}>
                                            <Label>{field.label}</Label>
                                        </Cell>

                                        <>
                                            {value.map((url: string, index: number) => (
                                                <Cell span={3} key={url}>
                                                    <InnerImageFieldWrapper>
                                                        <File
                                                            url={url}
                                                            showFileManager={() =>
                                                                selectFiles(index)
                                                            }
                                                            onRemove={() =>
                                                                onChange(
                                                                    dotProp.delete(value, index)
                                                                )
                                                            }
                                                            placeholder={t`Select a file"`}
                                                            data-testid={`fr.input.file.${field.label}.${index}`}
                                                        />
                                                    </InnerImageFieldWrapper>
                                                </Cell>
                                            ))}
                                        </>

                                        <Cell span={3}>
                                            <InnerImageFieldWrapper>
                                                <File
                                                    url={""}
                                                    onRemove={() => {
                                                        return void 0;
                                                    }}
                                                    {...bind}
                                                    showFileManager={() => selectFiles()}
                                                    placeholder={t`Select a file"`}
                                                    data-testid={`fr.input.file.${field.label}`}
                                                />
                                            </InnerImageFieldWrapper>
                                        </Cell>
                                    </GridInner>
                                );
                            }}
                        />
                    </FileUploadWrapper>
                );
            }}
        </Bind>
    );
};
/**
 * Not used?
 */
// TODO @ts-refactor
FieldRenderer.defaultProps = {
    validation: {
        isValid: null
    },
    styles: { width: "100%", height: "auto" }
} as Partial<FieldRendererProps>;

const plugin: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-files",
    renderer: {
        rendererName: "file-inputs",
        name: t`File Inputs`,
        description: t`Enables selecting multiple files via File Manager.`,
        canUse({ field }) {
            return field.type === "file" && !!field.multipleValues;
        },
        render({ field, getBind, Label }) {
            return <FieldRenderer field={field} getBind={getBind} Label={Label} />;
        }
    }
};

export default plugin;
