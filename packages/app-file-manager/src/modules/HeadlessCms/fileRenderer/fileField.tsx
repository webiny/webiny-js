import React from "react";
import type {
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types.js";
import { FileManager } from "@webiny/app-admin";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl/index.js";
import { FilePicker } from "@webiny/admin-ui";
import { getSupportedExtensionsLabelHint } from "~/modules/HeadlessCms/fileRenderer/utils.js";
import { useEffectivePermissions } from "@webiny/app-headless-cms-common";

const FieldRenderer = ({ field, getBind }: CmsModelFieldRendererProps) => {
    const Bind = getBind();
    const { canEdit } = useEffectivePermissions(field, Bind.parentName);

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
                                                disabled={!canEdit}
                                                label={field.label}
                                                validation={validation}
                                                description={field.description}
                                                hint={field.help}
                                                note={getSupportedExtensionsLabelHint(imagesOnly)}
                                                value={value}
                                                onSelectItem={() => {
                                                    showFileManager(file => onChange(file.src));
                                                }}
                                                onEditItem={() => editFile(value)}
                                                onRemoveItem={() => onChange(null)}
                                                placeholder={field.placeholder}
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
            return field.type === "file" && !field.list;
        },
        render(params) {
            return <FieldRenderer {...params} />;
        }
    }
};
