import { mimeTypes } from "./mimeTypes.js";

const extensionToMime = new Map<string, string>();
for (const [mime, extensions] of Object.entries(mimeTypes)) {
    for (const ext of extensions) {
        if (!extensionToMime.has(ext)) {
            extensionToMime.set(ext, mime);
        }
    }
}

/**
 * A file's MIME type. When none is given, it comes from the file name's extension, and an
 * unknown extension falls back to `application/octet-stream`.
 */
export class FileMimeType {
    static readonly DEFAULT = "application/octet-stream";

    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static from(type: string | undefined): FileMimeType {
        return new FileMimeType(type || FileMimeType.DEFAULT);
    }

    static fromName(name: string): FileMimeType {
        const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
        return new FileMimeType(extensionToMime.get(ext) || FileMimeType.DEFAULT);
    }

    toString(): string {
        return this.value;
    }
}
