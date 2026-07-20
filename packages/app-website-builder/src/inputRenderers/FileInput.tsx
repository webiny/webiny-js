import React, { useState } from "react";
import { FilePicker, ImageEditor, type ImageEditorValue } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { FileManager, type FileManagerFileItem } from "@webiny/app-admin";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import type { FileInput, WebinyImageEdit, WebinyImageValue } from "@webiny/website-builder-sdk";
import { fileManagerItemToValue } from "~/shared/fileManagerItemToValue.js";

const isEditableImage = (value: WebinyImageValue | undefined): value is WebinyImageValue => {
    return (
        !!value?.src &&
        typeof value.mimeType === "string" &&
        value.mimeType.startsWith("image/") &&
        value.mimeType !== "image/svg+xml"
    );
};

export const FileInputRenderer = ({
    value,
    onChange,
    label,
    ...props
}: ElementInputRendererProps) => {
    const input = props.input as FileInput;
    const { isBaseBreakpoint } = useBreakpoint();
    const [editorOpen, setEditorOpen] = useState(false);

    const fileValue = value as WebinyImageValue | undefined;
    const editable = isEditableImage(fileValue);

    const onFileChange = (file: FileManagerFileItem) => {
        onChange(({ value }) => {
            const newValue = fileManagerItemToValue(file);
            value.set(newValue);
        });
    };

    const onRemove = () => {
        onChange(({ value }) => {
            if (isBaseBreakpoint) {
                value.set(undefined);
            } else {
                value.set(null);
            }
        });
    };

    // Save the per-usage crop/hotspot/alt override back onto the element's value.
    const onSaveEdit = (edit: ImageEditorValue) => {
        onChange(({ value }) => {
            const hasEdit = Object.keys(edit).length > 0;
            value.set({
                ...(fileValue as WebinyImageValue),
                edit: hasEdit ? (edit as WebinyImageEdit) : undefined
            });
        });
    };

    return (
        <FileManager
            accept={input.allowedFileTypes}
            onChange={onFileChange}
            render={({ showFileManager }) => (
                <>
                    <FilePicker
                        variant={"secondary"}
                        label={label}
                        description={input.description}
                        type="compact"
                        value={value}
                        onSelectItem={() => showFileManager()}
                        onRemoveItem={onRemove}
                        // The "Edit" (pencil) action edits the image (crop / focal
                        // point / alt). Replacing the file is done by clicking the
                        // preview. For non-images there is nothing to edit, so the
                        // pencil is hidden.
                        onEditItem={editable ? () => setEditorOpen(true) : undefined}
                    />
                    {editable ? (
                        <ImageEditor
                            open={editorOpen}
                            onClose={() => setEditorOpen(false)}
                            image={{
                                src: fileValue.src,
                                width: fileValue.width ?? 0,
                                height: fileValue.height ?? 0
                            }}
                            value={fileValue.edit as ImageEditorValue | undefined}
                            onSave={onSaveEdit}
                        />
                    ) : null}
                </>
            )}
        />
    );
};
