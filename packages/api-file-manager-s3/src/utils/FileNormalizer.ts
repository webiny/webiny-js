import { mdbid } from "@webiny/utils";
import { FileData, PresignedPostPayloadData } from "~/types";
import { FileKey } from "~/utils/FileKey";
import { FileModifier } from "./FileUploadModifier";

export interface FileToSign {
    name: string;
    key: string;
    type: string;
    size: number;
}

/**
 * FileNormalizer normalizes file data, before it's signed for upload to S3.
 * It generates a unique file id, and makes sure that the file key includes the unique id.
 *
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
            type: payload.type || "application/octet-stream"
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
