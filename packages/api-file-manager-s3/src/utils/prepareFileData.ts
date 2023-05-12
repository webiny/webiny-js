// @ts-ignore `mdbid` has no type declarations
import mdbid from "mdbid";
import sanitizeFilename from "sanitize-filename";
import { PresignedPostPayloadData, FileData } from "~/types";
import { mimeTypes } from "./mimeTypes";

export const prepareFileData = (data: PresignedPostPayloadData): FileData => {
    // If type is missing, let's use the default "application/octet-stream" type,
    // which is also the default type that the Amazon S3 would use.
    const contentType = data.type || "application/octet-stream";

    const id = data.id || mdbid();
    let key = data.key || sanitizeFilename(data.name);

    // We must prefix file key with file ID.
    if (!key.startsWith(id)) {
        key = id + "/" + key;
    }

    if (data.keyPrefix) {
        key = data.keyPrefix + key;
    }

    // Replace all whitespace.
    key = key.replace(/\s/g, "");

    // Make sure file key contains a file extension
    const extensions = mimeTypes[data.type];
    if (extensions && !extensions.some(ext => key.endsWith(`.${ext}`))) {
        key = key + `.${extensions[0]}`;
    }

    return {
        id,
        name: data.name,
        key,
        type: contentType,
        size: data.size
    };
};
