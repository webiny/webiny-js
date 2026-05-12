import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { FileManager } from "~/base/ui/FileManager.js";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";
import { MultiFilePicker } from "@webiny/admin-ui";
import type { FileItemDto } from "@webiny/admin-ui";
import type { FileValue } from "~/features/formModel/abstractions.js";
import type { FileFieldSettings } from "~/features/formModel/fieldTypes/FileFieldType.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        multiFilePicker: { fieldType: "file"; settings: FileFieldSettings };
    }
}

const toFilePickerValues = (value: unknown): FileItemDto[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((item: FileValue) => item?.src)
        .map((item: FileValue) => ({
            id: item.id,
            url: item.src,
            name: item.name,
            mimeType: item.mimeType,
            size: item.size
        }));
};

const fileManagerItemToValue = (file: FileManagerFileItem): FileValue => ({
    id: file.id,
    name: file.name,
    size: file.size,
    mimeType: file.type,
    src: file.src || "",
    width: file.width,
    height: file.height
});

export const MultiFilePickerRenderer = createFieldRenderer<"multiFilePicker">(({ field }) => {
    const settings = field.rendererSettings as FileFieldSettings | undefined;
    const values = toFilePickerValues(field.value);
    const currentValues = (Array.isArray(field.value) ? field.value : []) as FileValue[];

    return (
        <FileManager
            multiple
            images={settings?.images}
            accept={settings?.accept}
            own={settings?.own}
            scope={settings?.scope}
            render={({ showFileManager }) => {
                const selectFiles = (replaceIndex = -1) => {
                    showFileManager((files: FileManagerFileItem[]) => {
                        const newValues = files.map(fileManagerItemToValue);
                        if (replaceIndex === -1) {
                            field.onChange([...currentValues, ...newValues]);
                        } else {
                            field.onChange([
                                ...currentValues.slice(0, replaceIndex),
                                ...newValues,
                                ...currentValues.slice(replaceIndex + 1)
                            ]);
                        }
                    });
                };

                return (
                    <MultiFilePicker
                        label={field.label}
                        description={field.description}
                        note={field.note}
                        hint={field.help}
                        values={values}
                        type="compact"
                        onSelectItem={() => selectFiles()}
                        onReplaceItem={(_, index) => selectFiles(index)}
                        onRemoveItem={(_, index) => {
                            field.onChange([
                                ...currentValues.slice(0, index),
                                ...currentValues.slice(index + 1)
                            ]);
                        }}
                    />
                );
            }}
        />
    );
});
