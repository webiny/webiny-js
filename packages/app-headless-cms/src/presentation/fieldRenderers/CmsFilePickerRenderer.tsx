import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { FileManager } from "@webiny/app-admin/base/ui/FileManager.js";
import { FilePicker, type FileItemDto } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";
import type { FileFieldSettings } from "@webiny/app-admin/features/formModel/fieldTypes/FileFieldType.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsFilePicker: { fieldType: "file"; settings: FileFieldSettings };
    }
}

export const CmsFilePickerRenderer = createFieldRenderer<"cmsFilePicker">(({ field }) => {
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
                    note={field.note}
                    hint={field.help}
                    type="compact"
                    value={toFilePickerValue(field.value)}
                    validation={field.validation}
                    onSelectItem={() =>
                        showFileManager((file: FileManagerFileItem) => {
                            field.onChange(file.src || "");
                        })
                    }
                    onRemoveItem={() => field.onChange(null)}
                />
            )}
        />
    );
});

const toFilePickerValue = (value: unknown): FileItemDto | undefined => {
    if (!value || typeof value !== "string") {
        return undefined;
    }

    const name = value.split("/").pop() || "";

    return { url: value, name, mimeType: guessMimeType(name) };
};

const guessMimeType = (name: string): string => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        svg: "image/svg+xml",
        webp: "image/webp",
        pdf: "application/pdf"
    };
    return map[ext] || "application/octet-stream";
};
