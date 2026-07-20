import type { FileManagerFileItem } from "@webiny/app-admin";

export const fileManagerItemToValue = (file: FileManagerFileItem) => {
    // Seed the per-usage edit from the asset-level default (set in File Manager),
    // if any. From here on the edit lives on the element's value and is editable
    // per placement.
    const assetEdit = file.metadata?.imageEdit;

    return {
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        src: file.src || "",
        width: file.width,
        height: file.height,
        ...(assetEdit ? { edit: assetEdit } : {})
    };
};
