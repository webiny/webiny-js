// TODO: Move "archive" in layer
import Archiver from "archiver/lib/core";
import vending from "archiver";

import { Readable } from "stream";
import { File } from "~/types";
import { s3StreamHandler } from "~/graphql/crud/pages/s3StreamHandler";
import * as path from "path";

export function extractFilesFromPageData(data: Record<string, any>, files: any[]): ImageFile[] {
    // Base case: termination
    if (!data || typeof data !== "object") {
        return files;
    }
    // Recursively call function for each element
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            extractFilesFromPageData(element, files);
        }
        return files;
    }

    // Main
    const tuple = Object.entries(data);
    for (let i = 0; i < tuple.length; i++) {
        const [key, value] = tuple[i];
        if (key === "file" && value) {
            files.push(value);
        } else {
            extractFilesFromPageData(value, files);
        }
    }
    return files;
}

// UPLOAD ZIP

interface S3DownloadStreamDetails {
    stream: Readable;
    filename: string;
}

interface ImageFile extends File {
    key: string;
}

export interface ZipHandlerConfig {
    files: ImageFile[];
    archiveFileName: string;
    archiveFormat: Archiver.Format;
    filesDirName: string;
    s3FileKey: string;
}

export class ZipHandler {
    config: ZipHandlerConfig;

    constructor(config: ZipHandlerConfig) {
        this.config = config;
    }

    s3DownloadStreams(): S3DownloadStreamDetails[] {
        const files = this.config.files.map(({ key }) => {
            return {
                stream: s3StreamHandler.readStream(process.env.S3_BUCKET, key),
                filename: `${this.config.filesDirName}\\${path.basename(key)}`
            };
        });
        return [
            ...files,
            {
                stream: s3StreamHandler.readStream(process.env.S3_BUCKET, this.config.s3FileKey),
                filename: `${path.basename(this.config.s3FileKey)}`
            }
        ];
    }

    async process(): Promise<string> {
        const { s3StreamUpload, uploaded } = s3StreamHandler.writeStream(
            process.env.S3_BUCKET,
            this.config.archiveFileName
        );
        const s3DownloadStreams = this.s3DownloadStreams();
        // TODO: improve this code block
        await new Promise((resolve, reject) => {
            const archive = vending.create(this.config.archiveFormat);
            archive.on("error", (error: Archiver.ArchiverError) => {
                throw new Error(
                    `${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
                );
            });

            console.log("Starting upload");

            s3StreamUpload.on("close", resolve);
            s3StreamUpload.on("end", resolve);

            s3StreamUpload.on("error", reject);

            archive.pipe(s3StreamUpload);

            s3DownloadStreams.forEach((streamDetails: S3DownloadStreamDetails) =>
                archive.append(streamDetails.stream, { name: streamDetails.filename })
            );
            archive.finalize();
        }).catch((error: { code: string; message: string; data: string }) => {
            throw new Error(`${error.code} ${error.message} ${error.data}`);
        });

        const zipData = await uploaded.promise();
        return zipData.Location;
    }
}
