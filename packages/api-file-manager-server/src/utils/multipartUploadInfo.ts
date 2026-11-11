import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

/**
 * Holds the key of the file a multipart upload was created for, so completing the upload can only
 * write its parts to that file. Parts are stored next to it as `part-<n>`.
 */
const UPLOAD_INFO_FILE = "upload.json";

interface MultipartUploadInfo {
    fileKey: string;
}

export const writeMultipartUploadInfo = async (
    multipartDir: string,
    info: MultipartUploadInfo
): Promise<void> => {
    await writeFile(path.join(multipartDir, UPLOAD_INFO_FILE), JSON.stringify(info), {
        flag: "wx"
    });
};

export const readMultipartUploadInfo = async (
    multipartDir: string
): Promise<MultipartUploadInfo | undefined> => {
    try {
        const json = await readFile(path.join(multipartDir, UPLOAD_INFO_FILE), "utf-8");
        const info = JSON.parse(json) as Partial<MultipartUploadInfo>;
        return typeof info.fileKey === "string" ? { fileKey: info.fileKey } : undefined;
    } catch {
        return undefined;
    }
};
