import { mdbid } from "@webiny/utils";
import type { FileData, PresignedPostPayloadData } from "~/features/upload/types.js";
import { FileKey } from "./FileKey.js";
import { validateFileKey } from "~/domain/file/validateFileKey.js";
import { InvalidFileKeyError } from "~/domain/file/errors.js";
import { FileMimeType } from "~/domain/file/FileMimeType.js";
import type { FileModifier } from "./FileUploadModifier.js";

export interface FileToSign {
    name: string;
    key: string;
    type: string;
    size: number;
}

// Security: a client id becomes a storage path segment; allow only CMS-style ids.
const FILE_ID_PATTERN = /^([a-zA-Z0-9])([a-zA-Z0-9-]+)([a-zA-Z0-9])$/;

/*
 * FileNormalizer normalizes file data, before it's signed for upload.
 * It generates a unique file id, and makes sure that the file key includes the unique id.
 */
export class FileNormalizer {
    private readonly modifier: FileModifier | undefined;

    constructor(modifier?: FileModifier) {
        this.modifier = modifier;
    }

    async normalizeFile(payload: PresignedPostPayloadData): Promise<FileData> {
        const keyPrefix = (payload.keyPrefix ?? "").trim();
        const segments = keyPrefix.split("/").map(segment => segment.trim());
        if (
            keyPrefix.startsWith("/") ||
            keyPrefix.includes("\\") ||
            segments.some(segment => segment === ".." || segment === ".")
        ) {
            throw new InvalidFileKeyError({ key: keyPrefix, id: payload.id });
        }

        if (payload.id && !FILE_ID_PATTERN.test(payload.id)) {
            throw new InvalidFileKeyError({ key: keyPrefix, id: payload.id });
        }

        const data = {
            ...payload,
            keyPrefix: keyPrefix || undefined,
            id: payload.id || mdbid(),
            type: payload.type || FileMimeType.fromName(payload.name).toString()
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

        // The ID and key prefix come from the client and end up in a storage path.
        const fileKey = key.toString();
        const keyResult = validateFileKey({ key: fileKey, id: data.id });
        if (keyResult.isFail()) {
            throw keyResult.error;
        }

        return {
            id: data.id,
            key: fileKey,
            name: file.name,
            size: file.size,
            type: file.type
        };
    }
}
