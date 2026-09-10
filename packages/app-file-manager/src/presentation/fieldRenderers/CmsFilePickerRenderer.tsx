import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { FileManager } from "@webiny/app-admin/base/ui/FileManager.js";
import { FilePicker } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";
import type { FileFieldSettings } from "@webiny/app-admin/features/formModel/fieldTypes/FileFieldType.js";
import { isEditableImageUrl, useCmsImageEditor } from "~/presentation/hooks/useCmsImageEditor.js";
import { CmsImageEditorDialog } from "./CmsImageEditorDialog.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsFilePicker: { fieldType: "file"; settings: FileFieldSettings };
    }
}

export const CmsFilePickerRenderer = createFieldRenderer<"cmsFilePicker">(({ field }) => {
    const settings = field.rendererSettings as FileFieldSettings | undefined;
    const value = field.value as string | undefined;
    const editor = useCmsImageEditor();

    return (
        <FileManager
            images={settings?.images}
            accept={settings?.accept}
            own={settings?.own}
            scope={settings?.scope}
            render={({ showFileManager }) => (
                <>
                    <FilePicker
                        label={field.label}
                        description={field.description}
                        note={field.note}
                        hint={field.help}
                        type="compact"
                        value={value}
                        validation={field.validation}
                        onSelectItem={() =>
                            showFileManager((file: FileManagerFileItem) => {
                                field.onChange(file.src || "");
                            })
                        }
                        onRemoveItem={() => field.onChange(null)}
                        // The "Edit" (pencil) action opens the crop / focal point /
                        // alt editor for image values (edits the file's asset-level
                        // settings). Hidden for non-images.
                        onEditItem={
                            isEditableImageUrl(value) ? () => editor.openFor(value) : undefined
                        }
                    />
                    <CmsImageEditorDialog editor={editor} />
                </>
            )}
        />
    );
});
