import React from "react";
import {
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types";
import { FileManager } from "@webiny/app-admin/components";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl";
import { FilePicker } from "@webiny/admin-ui";
import { getSupportedExtensionsLabelHint } from "~/modules/HeadlessCms/fileRenderer/utils";

const FieldRenderer = ({ field, getBind }: CmsModelFieldRendererProps) => {
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;

    return (
        <Bind>
            {bind => {
                const { value, onChange, validation } = bind;

                return (
                    <Bind.ValidationContainer>
                        <EditFileUsingUrl onSetFile={file => bind.onChange(file.src)}>
                            {({ editFile }) => (
                                <FileManager
                                    images={imagesOnly}
                                    render={({ showFileManager }) => {
                                        return (
                                            <FilePicker
                                                {...bind}
                                                label={field.label}
                                                validation={validation}
                                                description={[
                                                    field.helpText,
                                                    getSupportedExtensionsLabelHint(imagesOnly)
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ")}
                                                value={value}
                                                onSelectItem={() =>
                                                    showFileManager(file => onChange(file.src))
                                                }
                                                onEditItem={() => editFile(value)}
                                                onRemoveItem={() => onChange(null)}
                                                placeholder={field.placeholderText}
                                                type={"compact"}
                                                data-testid={`fr.input.filefield.${field.label}`}
                                            />
                                        );
                                    }}
                                />
                            )}
                        </EditFileUsingUrl>
                    </Bind.ValidationContainer>
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
