import { mdbid } from "@webiny/utils";
import { BaseError } from "@webiny/feature/api";
import type { FileData, PresignedPostPayloadData } from "~/features/upload/types.js";
import { FileKey } from "./FileKey.js";
import { mimeTypes } from "./mimeTypes.js";
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

class InvalidKeyPrefixError extends BaseError<{ keyPrefix: string }> {
    override readonly code = "INVALID_KEY_PREFIX" as const;

    constructor(keyPrefix: string) {
        super({ message: `Invalid file key prefix "${keyPrefix}".`, data: { keyPrefix } });
    }
}

class InvalidFileIdError extends BaseError<{ id: string }> {
    override readonly code = "INVALID_FILE_ID" as const;

    constructor(id: string) {
        super({
            message: `Invalid file id "${id}". It may contain only letters, numbers and dashes, and must start and end with a letter or a number.`,
            data: { id }
        });
    }
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
            throw new InvalidKeyPrefixError(keyPrefix);
        }

        if (payload.id && !FILE_ID_PATTERN.test(payload.id)) {
            throw new InvalidFileIdError(payload.id);
        }

        const data = {
            ...payload,
            keyPrefix: keyPrefix || undefined,
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
