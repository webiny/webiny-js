import fs from "fs";
import path from "path";

interface DownloadFolderFromS3Params {
    bucketName: string;
    bucketRegion: string;
    bucketFolderKey: string;
    downloadFolderPath: string;
}

export class NoObjectsFoundError extends Error {
    code = "NO_OBJECTS_FOUND";
    constructor(message: string) {
        super(message);
        this.name = "NoObjectsFoundError";
    }
}

export const downloadFolderFromS3 = async (params: DownloadFolderFromS3Params) => {
    const { bucketName, bucketRegion, bucketFolderKey, downloadFolderPath } = params;

    const s3FolderKey = `v6/${bucketFolderKey}`;
    const baseUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com`;

    const listObjects = async (): Promise<string[]> => {
        const keys: string[] = [];
        let continuationToken: string | undefined;

        do {
            let url = `${baseUrl}/?list-type=2&prefix=${encodeURIComponent(s3FolderKey)}`;
            if (continuationToken) {
                url += `&continuation-token=${encodeURIComponent(continuationToken)}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(
                    `Failed to list objects: ${response.status} ${response.statusText}`
                );
            }

            const xml = await response.text();

            for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
                keys.push(match[1]);
            }

            const isTruncated = xml.includes("<IsTruncated>true</IsTruncated>");
            continuationToken = isTruncated
                ? xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1]
                : undefined;
        } while (continuationToken);

        return keys;
    };

    const downloadFile = async (key: string, localPath: string): Promise<void> => {
        const response = await fetch(`${baseUrl}/${key}`);
        if (!response.ok) {
            throw new Error(`Failed to download ${key}: ${response.status} ${response.statusText}`);
        }
        fs.writeFileSync(localPath, Buffer.from(await response.arrayBuffer()));
    };

    const keys = await listObjects();
    if (!keys.length) {
        throw new NoObjectsFoundError(`No objects found in the specified S3 folder.`);
    }

    for (const key of keys) {
        const relativePath = path.relative(s3FolderKey, key);
        const localFilePath = path.join(downloadFolderPath, relativePath);

        if (key.endsWith("/")) {
            if (!fs.existsSync(localFilePath)) {
                fs.mkdirSync(localFilePath, { recursive: true });
            }
        } else {
            const localDirPath = path.dirname(localFilePath);
            if (!fs.existsSync(localDirPath)) {
                fs.mkdirSync(localDirPath, { recursive: true });
            }
            await downloadFile(key, localFilePath);
        }
    }
};
