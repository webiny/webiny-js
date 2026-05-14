import React from "react";
import dotProp from "dot-prop-immutable";
import type {
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { FileManager } from "@webiny/app-admin";
import { getSupportedExtensionsLabelHint } from "./utils.js";
import { MultiFilePicker } from "@webiny/admin-ui";
import { useFieldEffectiveRules, useModelField } from "@webiny/app-headless-cms-common";

const t = i18n.ns("app-headless-cms/admin/fields/file");

const FieldRenderer = ({ getBind }: CmsModelFieldRendererProps) => {
    const { field } = useModelField();
    const rules = useFieldEffectiveRules(field);
    const disabled = !rules.canEdit || rules.disabled;
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;

    return (
        <Bind>
            {bind => {
                const { onChange, validation } = bind;

                const values: string[] = (
                    Array.isArray(bind.value) ? bind.value : [bind.value]
                ).filter(Boolean);

                return (
                    <Bind.ValidationContainer>
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
                                        disabled={disabled}
                                        label={field.label}
                                        validation={validation}
                                        description={field.description}
                                        note={getSupportedExtensionsLabelHint(imagesOnly)}
                                        values={values}
                                        onSelectItem={() => selectFiles()}
                                        onReplaceItem={(_, index) => selectFiles(index)}
                                        onRemoveItem={(_, index) =>
                                            onChange(dotProp.delete(values, index))
                                        }
                                        placeholder={field.placeholder}
                                        type={"compact"}
                                        data-testid={`fr.input.filefields.${field.label}`}
                                    />
                                );
                            }}
                        />
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
            return field.type === "file" && !!field.list;
        },
        render(props) {
            return <FieldRenderer {...props} />;
        }
    }
};
