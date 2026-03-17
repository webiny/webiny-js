import { isBrowser } from "../../../utils/platform.js";

export function isBuffer(file: any): file is Buffer {
    return Buffer.isBuffer(file);
}

export function isBlob(file: any): file is Blob {
    return typeof Blob !== "undefined" && file instanceof Blob;
}

export function isFile(file: any): file is File {
    return isBrowser && typeof File !== "undefined" && file instanceof File;
}

export function getFileSize(file: Buffer | Blob | File): number {
    if (isBuffer(file)) {
        return file.length;
    }
    return file.size;
}
