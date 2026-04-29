import React from "react";
import { observer } from "mobx-react-lite";
import { FileManager } from "~/base/ui/FileManager.js";
import { FilePicker } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/abstractions.js";
import type { FileManagerFileItem } from "~/base/ui/FileManager.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        fileUrlPicker: { fieldType: "fileUrl"; settings: undefined };
    }
}

export const FileUrlPickerRenderer = observer(({ field }: { field: IFieldVM }) => {
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
