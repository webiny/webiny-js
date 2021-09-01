// TODO: Move "archive" in layer
import Archiver from "archiver/lib/core";
import vending from "archiver";
import S3 from "aws-sdk/clients/s3";
import { Readable } from "stream";
import { s3StreamHandler } from "./s3StreamHandler";
import * as path from "path";
import { ImageFile } from "./utils";

interface S3DownloadStreamDetails {
    stream: Readable;
    filename: string;
}

export interface ZipHandlerConfig {
    files: ImageFile[];
    archiveFileName: string;
    filesDirName: string;
    s3FileKey: string;
}

export default class ZipHandler {
    private readonly archiveFormat = "zip";
    config: ZipHandlerConfig;

    constructor(config: ZipHandlerConfig) {
        this.config = config;
    }

    s3DownloadStreams(): S3DownloadStreamDetails[] {
        const files = this.config.files.map(({ key }) => {
            return {
                stream: s3StreamHandler.readStream(key),
                filename: `${this.config.filesDirName}\\${path.basename(key)}`
            };
        });

        return [
            ...files,
            {
                stream: s3StreamHandler.readStream(this.config.s3FileKey),
                filename: `${path.basename(this.config.s3FileKey)}`
            }
        ];
    }

    async process(): Promise<S3.ManagedUpload.SendData> {
        const { s3StreamUpload, streamUploadPromise } = s3StreamHandler.writeStream(
            this.config.archiveFileName
        );
        const s3DownloadStreams = this.s3DownloadStreams();

        // TODO: improve this code block
        await new Promise((resolve, reject) => {
            const archive = vending.create(this.archiveFormat);
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

            // Just debugging
            archive.on("progress", progress => {
                console.log("Archiver [progress]");
                console.log(progress);
                console.log(JSON.stringify(progress.entries));
            });

            s3DownloadStreams.forEach((streamDetails: S3DownloadStreamDetails) =>
                archive.append(streamDetails.stream, { name: streamDetails.filename })
            );
            archive.finalize();
        });

        return streamUploadPromise;
    }
}
