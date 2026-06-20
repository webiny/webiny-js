import { mdbid } from "@webiny/utils";
import type { FileData, PresignedPostPayloadData } from "~/types.js";
import { FileKey } from "~/utils/FileKey.js";
import { mimeTypes } from "~/utils/mimeTypes.js";
import type { FileModifier } from "./FileUploadModifier.js";

export interface FileToSign {
    name: string;
    key: string;
    type: string;
    size: number;
}

const extensionToMime = new Map<string, string>();
for (const [mime, extensions] of Object.entries(mimeTypes)) {
    for (const ext of extensions) {
        if (!extensionToMime.has(ext)) {
            extensionToMime.set(ext, mime);
        }
    }
}

function resolveTypeFromName(name: string): string {
    const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
    return extensionToMime.get(ext) || "application/octet-stream";
}

/*
 * FileNormalizer normalizes file data, before it's signed for upload to S3.
 * It generates a unique file id, and makes sure that the file key includes the unique id.
 */
export class FileNormalizer {
    private readonly modifier: FileModifier | undefined;

    constructor(modifier?: FileModifier) {
        this.modifier = modifier;
    }

    async normalizeFile(payload: PresignedPostPayloadData): Promise<FileData> {
        const data = {
            ...payload,
            id: payload.id || mdbid(),
            type: payload.type || resolveTypeFromName(payload.name)
        };

        const key = new FileKey(data);
        const defaultKey = key.toString();

        const file: FileToSign = {
            name: data.name,
            type: data.type,
            key: defaultKey,
            size: data.size
        };

        if (this.modifier) {
            Object.assign(file, await this.modifier(file));
        }

        if (defaultKey !== file.key) {
            key.setKey(file.key);
        }

        return {
            id: data.id,
            key: key.toString(),
            name: file.name,
            size: file.size,
            type: file.type
        };
    }
}
