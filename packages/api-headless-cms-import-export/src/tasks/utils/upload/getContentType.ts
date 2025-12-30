import type { GenericRecord, NonEmptyArray } from "@webiny/api/types.js";
import {
    WBY_EXPORT_ASSETS_EXTENSION,
    WBY_EXPORT_ENTRIES_EXTENSION
} from "~/tasks/constants.js";

const allowedContentTypes: GenericRecord<string, NonEmptyArray<string>> = {
    "application/zip": ["zip", WBY_EXPORT_ENTRIES_EXTENSION, WBY_EXPORT_ASSETS_EXTENSION],
    "application/json": ["json"],
    "text/plain": ["txt"]
};

export const getContentType = (filename: string): string => {
    const ext = filename.split(".").pop();
    if (!ext) {
        throw new Error(
            `Could not determine the file extension from the provided filename: ${filename}`
        );
    }
    for (const type in allowedContentTypes) {
        const extensions = allowedContentTypes[type];
        if (extensions.includes(ext)) {
            return type;
        }
    }

    throw new Error(
        `Could not determine the file content type from the provided extension: ${ext}.`
    );
};
