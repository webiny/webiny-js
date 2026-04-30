import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { FileManager } from "~/base/ui/FileManager.js";
import { FilePicker } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        fileUrlPicker: { fieldType: "fileUrl"; settings: undefined };
    }
}

export const FileUrlPickerRenderer = createFieldRenderer(({ field }) => {
    return (
        <FileManager
            images={true}
            render={({ showFileManager }) => (
                <FilePicker
                    label={field.label}
                    description={field.description}
                    type="area"
                    value={field.value as string | undefined}
                    onSelectItem={() =>
                        showFileManager((file: FileManagerFileItem) => {
                            field.onChange(file.src || "");
                        })
                    }
                    onRemoveItem={() => field.onChange(undefined)}
                />
            )}
        />
    );
});
