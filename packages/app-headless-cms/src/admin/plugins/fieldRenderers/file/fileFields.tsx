import React from "react";
import dotProp from "dot-prop-immutable";
import { CmsEditorFieldRendererPlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, GridInner } from "@webiny/ui/Grid";
import { imageWrapperStyles } from "./utils";
import { FileManager } from "@webiny/app-admin/components";
import styled from "@emotion/styled";
import File from "./File";

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

function FieldRenderer({ getBind, Label, field }) {
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;

    return (
        <Bind>
            {bind => {
                const { value, onChange } = bind;
                return (
                    <FileUploadWrapper className={imageWrapperStyles}>
                        <FileManager multiple={true} images={imagesOnly}>
                            {({ showFileManager }) => {
                                const selectFiles = (index = -1) => {
                                    showFileManager(files => {
                                        if (!files) {
                                            return;
                                        }

                                        const urls = files.map(f => f.src);
                                        if (index === -1) {
                                            onChange([...(value || []), ...urls]);
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

                                        {value.map((url, index) => (
                                            <Cell span={3} key={url}>
                                                <File
                                                    url={url}
                                                    showFileManager={() => selectFiles(index)}
                                                    onRemove={() =>
                                                        onChange(dotProp.delete(value, index))
                                                    }
                                                    placeholder={t`Select a file"`}
                                                />
                                            </Cell>
                                        ))}

                                        <Cell span={3}>
                                            <File
                                                {...bind}
                                                showFileManager={() => selectFiles()}
                                                placeholder={t`Select a file"`}
                                            />
                                        </Cell>
                                    </GridInner>
                                );
                            }}
                        </FileManager>
                    </FileUploadWrapper>
                );
            }}
        </Bind>
    );
}

FieldRenderer.defaultProps = {
    validation: { isValid: null },
    styles: { width: "100%", height: "auto" }
};

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-files",
    renderer: {
        rendererName: "file-inputs",
        name: t`File Inputs`,
        description: t`Enables selecting multiple files via File Manager.`,
        canUse({ field }) {
            return field.type === "file" && field.multipleValues;
        },
        render({ field, getBind, Label }) {
            return <FieldRenderer field={field} getBind={getBind} Label={Label} />;
        }
    }
};

export default plugin;
