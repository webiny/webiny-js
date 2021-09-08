// TODO: Move "archive" in layer
import Archiver from "archiver/lib/core";
import vending from "archiver";
import S3 from "aws-sdk/clients/s3";
import { Readable } from "stream";
import * as path from "path";
import kebabCase from "lodash/kebabCase";
import uniqueId from "uniqid";
import { s3StreamHandler } from "./s3StreamHandler";
import { ImageFile } from "./utils";

interface S3DownloadStreamDetails {
    stream: Readable;
    filename: string;
}

interface ExportInfo {
    files: ImageFile[];
    pageDataUploadKey: string;
    pageTitle: string;
}

export interface ZipHandlerConfig {
    exportInfo: ExportInfo[];
}

export default class ZipHandler {
    private readonly archiveFormat = "zip";
    private readonly filesDirName = "assets";
    private readonly archiveFileName: string;
    config: ZipHandlerConfig;

    constructor(config: ZipHandlerConfig) {
        this.config = config;
        this.archiveFileName = uniqueId("", "-webiny-page-export.zip");
    }

    s3DownloadStreams(): S3DownloadStreamDetails[] {
        const result = [];
        // Map over exportInfo and make read stream for each file for each page
        for (let i = 0; i < this.config.exportInfo.length; i++) {
            const current = this.config.exportInfo[i];
            // TODO: Maybe make it unique because there might be more than one page with same title;
            // For example, "untitled"
            const prefix = kebabCase(current.pageTitle);
            const files = current.files.map(({ key }) => {
                return {
                    stream: s3StreamHandler.readStream(key),
                    filename: `${prefix}\\${this.filesDirName}\\${path.basename(key)}`
                };
            });

            result.push(...files, {
                stream: s3StreamHandler.readStream(current.pageDataUploadKey),
                filename: `${prefix}\\${path.basename(current.pageDataUploadKey)}`
            });
        }

        return result;
    }

    process(): Promise<S3.ManagedUpload.SendData> {
        const { streamPassThrough, streamPassThroughUploadPromise } = s3StreamHandler.writeStream(
            this.archiveFileName
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
