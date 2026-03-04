import React from "react";
import type {
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types.js";
import { FileManager } from "@webiny/app-admin";
import { useEffectiveRules, useModelField } from "@webiny/app-headless-cms-common";
import { FilePicker } from "@webiny/admin-ui";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl/index.js";
import { getSupportedExtensionsLabelHint } from "~/modules/HeadlessCms/fileRenderer/utils.js";

const FieldRenderer = ({ getBind }: CmsModelFieldRendererProps) => {
    const { field } = useModelField();
    const rules = useEffectiveRules(field);
    const disabled = !rules.canEdit || rules.disabled;
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
                                                disabled={disabled}
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
