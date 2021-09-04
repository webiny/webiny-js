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

    process(): Promise<S3.ManagedUpload.SendData> {
        const { streamPassThrough, streamPassThroughUploadPromise } = s3StreamHandler.writeStream(
            this.config.archiveFileName
        );

        // handle streamPassThrough events
        streamPassThrough.on("close", () => console.log(`"streamPassThrough" CLOSE`));
        streamPassThrough.on("end", () => console.log(`"streamPassThrough" END`));
        streamPassThrough.on("error", err => {
            console.log(`"streamPassThrough" ERROR`);
            console.log(err);
        });

        // 1. Read all files from S3 using stream
        const s3FilesStreams = this.s3DownloadStreams();

        // 2. Prepare zip from the file stream
        const archive = vending.create(this.archiveFormat);
        // handle archive events
        archive.on("error", (error: Archiver.ArchiverError) => {
            throw new Error(
                `${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
            );
        });

        // append all file streams to archive
        s3FilesStreams.forEach((streamDetails: S3DownloadStreamDetails) =>
            archive.append(streamDetails.stream, { name: streamDetails.filename })
        );

        // pipe archive output to streamPassThrough (Transform Stream) which will be uploaded to S3
        archive.pipe(streamPassThrough);
        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();

        // 3. Return upload stream promise
        return streamPassThroughUploadPromise;
    }
}
