import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@webiny/aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { WebinyError } from "@webiny/error";

interface DownloadFolderFromS3Params {
    bucketName: string;
    bucketRegion: string;
    bucketFolderKey: string;
    downloadFolderPath: string;
}

export const downloadFolderFromS3 = async (params: DownloadFolderFromS3Params) => {
    const { bucketName, bucketRegion, bucketFolderKey, downloadFolderPath } = params;

    // Configure the S3 client
    const s3Client = new S3Client({ region: bucketRegion });

    // List all objects in the specified S3 folder
    const listObjects = async (bucket: string, folderKey: string) => {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: folderKey
        });
        const response = await s3Client.send(command);
        return response.Contents;
    };

    // Download an individual file from S3
    const downloadFile = async (bucket: string, key: string, localPath: string) => {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        const response = await s3Client.send(command);

        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(localPath);
            // @ts-expect-error
            response.Body.pipe(fileStream);
            // @ts-expect-error
            response.Body.on("error", reject);
            fileStream.on("finish", resolve);
        });
    };

    const objects = (await listObjects(bucketName, bucketFolderKey)) || [];
    if (!objects.length) {
        throw new WebinyError(`No objects found in the specified S3 folder.`, "NO_OBJECTS_FOUND");
    }

    for (const object of objects) {
        const s3Key = object.Key!;
        const relativePath = path.relative(bucketFolderKey, s3Key);
        const localFilePath = path.join(downloadFolderPath, relativePath);

        if (s3Key.endsWith("/")) {
            // It's a directory, create it if it doesn't exist.
            if (!fs.existsSync(localFilePath)) {
                fs.mkdirSync(localFilePath, { recursive: true });
            }
        } else {
            // It's a file, download it.
            const localDirPath = path.dirname(localFilePath);
            if (!fs.existsSync(localDirPath)) {
                fs.mkdirSync(localDirPath, { recursive: true });
            }

            await downloadFile(bucketName, s3Key, localFilePath);
        }
    }
};
