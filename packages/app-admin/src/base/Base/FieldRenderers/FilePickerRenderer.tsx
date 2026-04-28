import React from "react";
import { observer } from "mobx-react-lite";
import { FileManager } from "~/base/ui/FileManager.js";
import { FilePicker, type FileItemDto } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/abstractions.js";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        filePicker: { fieldType: "file"; settings: undefined };
    }
}

export const FilePickerRenderer = observer(({ field }: { field: IFieldVM }) => {
    return (
        <FileManager
            images={true}
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
    const img = value as ImageValue | undefined;
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

type ImageValue = ReturnType<typeof fileManagerItemToValue>;
