import React, { useRef } from "react";
import dotProp from "dot-prop-immutable";
import type {
    BindComponentRenderProp,
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { FileManager } from "@webiny/app-admin/components/index.js";
import { getSupportedExtensionsLabelHint } from "./utils.js";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl/index.js";
import type { FileItem } from "@webiny/app-admin/types.js";
import { MultiFilePicker } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/file");

interface EditFileRef {
    index: number;
    url: string;
}

const FieldRenderer = ({ getBind, field }: CmsModelFieldRendererProps) => {
    const Bind = getBind();
    const editFileRef = useRef<EditFileRef | null>(null);

    const imagesOnly = field.settings && field.settings.imagesOnly;

    const onSetFile = (bind: BindComponentRenderProp) => {
        return (file: FileItem) => {
            if (!editFileRef.current) {
                return;
            }

            const newValue = [...bind.value];
            bind.onChange([
                ...newValue.slice(0, editFileRef.current.index),
                file.src,
                ...newValue.slice(editFileRef.current.index + 1)
            ]);

            editFileRef.current = null;
        };
    };

    return (
        <Bind>
            {bind => {
                const { onChange, validation } = bind;

                // We need to make sure the value is an array, since this is a multi-value component.
                const values: string[] = (
                    Array.isArray(bind.value) ? bind.value : [bind.value]
                ).filter(Boolean);

                return (
                    <Bind.ValidationContainer>
                        <EditFileUsingUrl onSetFile={onSetFile(bind)}>
                            {({ editFile }) => (
                                <FileManager
                                    multiple
                                    images={imagesOnly}
                                    render={({ showFileManager }) => {
                                        const selectFiles = (index = -1) => {
                                            showFileManager(files => {
                                                const urls = files.map(f => f.src);
                                                if (index === -1) {
                                                    onChange([...values, ...urls]);
                                                } else {
                                                    onChange([
                                                        ...values.slice(0, index),
                                                        ...urls,
                                                        ...values.slice(index + 1)
                                                    ]);
                                                }
                                            });
                                        };
                                        return (
                                            <MultiFilePicker
                                                {...bind}
                                                label={field.label}
                                                validation={validation}
                                                description={field.helpText}
                                                note={getSupportedExtensionsLabelHint(imagesOnly)}
                                                values={values}
                                                onSelectItem={() => selectFiles()}
                                                onReplaceItem={(_, index) => selectFiles(index)}
                                                onRemoveItem={(_, index) =>
                                                    onChange(dotProp.delete(values, index))
                                                }
                                                onEditItem={(value, index) => {
                                                    if (!value) {
                                                        return;
                                                    }

                                                    editFileRef.current = {
                                                        index,
                                                        url: value.url
                                                    };

                                                    editFile(value.url);
                                                }}
                                                placeholder={field.placeholderText}
                                                type={"compact"}
                                                data-testid={`fr.input.filefields.${field.label}`}
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

export const multipleFiles: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-files",
    renderer: {
        rendererName: "file-inputs",
        name: t`File Inputs`,
        description: t`Enables selecting multiple files via File Manager.`,
        canUse({ field }) {
            return field.type === "file" && !!field.multipleValues;
        },
        render(props) {
            return <FieldRenderer {...props} />;
        }
    }
};
