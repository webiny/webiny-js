import type { FileManagerFileItem } from "@webiny/app-admin";

export const fileManagerItemToValue = (file: FileManagerFileItem) => {
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
