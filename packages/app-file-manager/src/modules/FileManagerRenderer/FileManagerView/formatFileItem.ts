import type { FileItem } from "~/types.js";
import type { FileManagerFileItem } from "@webiny/app-admin";

/**
 * Convert a FileItem object to a FileManagerFileItem, which is then passed to `onChange` callback.
 */
export const formatFileItem = (file: FileItem): FileManagerFileItem => {
    return {
        id: file.id,
        src: file.src,
        name: file.name,
        type: file.type,
        size: file.size,
        width: file.metadata?.image?.width,
        height: file.metadata?.image?.height,
        // FM specific properties
        extensions: file.extensions,
        metadata: file.metadata
    };
};
