import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { FileManager } from "@webiny/app-admin/base/ui/FileManager.js";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";
import { MultiFilePicker } from "@webiny/admin-ui";
import type { FileFieldSettings } from "@webiny/app-admin/features/formModel/fieldTypes/FileFieldType.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsMultiFilePicker: { fieldType: "file"; settings: FileFieldSettings };
    }
}

export const CmsMultiFilePickerRenderer = createFieldRenderer<"cmsMultiFilePicker">(({ field }) => {
    const value = field.value as string[] | undefined;
    const settings = field.rendererSettings as FileFieldSettings | undefined;
    const currentValues = Array.isArray(value) ? value : [];

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
                        const newSrcs = files.map(f => f.src || "");
                        if (replaceIndex === -1) {
                            field.onChange([...currentValues, ...newSrcs]);
                        } else {
                            field.onChange([
                                ...currentValues.slice(0, replaceIndex),
                                ...newSrcs,
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
                        values={currentValues}
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
