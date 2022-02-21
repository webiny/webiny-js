// TODO @ts-refactor figure out correct bind types and remove any
import React from "react";
import dotProp from "dot-prop-immutable";
import { CmsEditorField, CmsEditorFieldRendererPlugin } from "~/types";
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

interface FieldRendererProps {
    getBind: GetBindCallable;
    Label: React.FC;
    field: CmsEditorField;
}
const FieldRenderer: React.FC<FieldRendererProps> = ({ getBind, Label, field }) => {
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;

    return (
        <Bind>
            {(bind: any) => {
                const { value, onChange } = bind;
                return (
                    <FileUploadWrapper className={imageWrapperStyles}>
                        <FileManager multiple={true} images={imagesOnly}>
                            {({ showFileManager }) => {
                                const selectFiles = (index = -1) => {
                                    showFileManager((files: FileItem[]) => {
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

                                        {value.map((url: string, index: number) => (
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
};
/**
 * Not used?
 */
// TODO @ts-refactor
FieldRenderer.defaultProps = {
    validation: { isValid: null },
    styles: { width: "100%", height: "auto" }
} as Partial<FieldRendererProps>;

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
