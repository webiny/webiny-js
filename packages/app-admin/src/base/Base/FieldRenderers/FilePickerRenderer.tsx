import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { FileManager } from "~/base/ui/FileManager.js";
import { FilePicker, type FileItemDto } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";
import type { FileValue } from "~/features/formModel/abstractions.js";
import type { FileFieldSettings } from "~/features/formModel/fieldTypes/FileFieldType.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        filePicker: { fieldType: "file"; settings: FileFieldSettings };
    }
}

export const FilePickerRenderer = createFieldRenderer<"filePicker">(({ field }) => {
    const settings = field.rendererSettings as FileFieldSettings | undefined;

    return (
        <FileManager
            images={settings?.images}
            accept={settings?.accept}
            own={settings?.own}
            scope={settings?.scope}
            render={({ showFileManager }) => (
                <FilePicker
                    label={field.label}
                    description={field.description}
                    type="area"
                    value={toFilePickerValue(field.value)}
                    onSelectItem={() =>
                        showFileManager((file: FileManagerFileItem) => {
                            field.onChange(fileManagerItemToValue(file));
                        })
                    }
                    onRemoveItem={() => field.onChange(undefined)}
                />
            )}
        />
    );
});

const toFilePickerValue = (value: unknown): FileItemDto | undefined => {
    const img = value as FileValue | undefined;
    if (!img?.src) {
        return undefined;
    }
    return { url: img.src, name: img.name, mimeType: img.mimeType };
};

const fileManagerItemToValue = (file: FileManagerFileItem) => {
    return {
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        src: file.src || "",
        width: file.width,
        height: file.height
    };
};
