// TODO: Move "archive" in layer
import vending, { ArchiverError } from "archiver";
import S3 from "aws-sdk/clients/s3";
import { Readable } from "stream";
import * as path from "path";
import kebabCase from "lodash/kebabCase";
import uniqueId from "uniqid";
import { s3Stream } from "./s3Stream";
import { ImageFile } from "./utils";

interface FileStreamDetails {
    stream: Readable;
    filename: string;
}

interface ExportInfo {
    files: ImageFile[];
    name: string;
    dataBuffer: Buffer;
}

export interface ZipperConfig {
    exportInfo: ExportInfo;
    archiveFileKey: string;
}

export default class Zipper {
    private readonly archiveFormat = "zip";
    private readonly filesDirName = "assets";
    private readonly archiveFileName: string;
    config: ZipperConfig;

    constructor(config: ZipperConfig) {
        this.config = config;
        this.archiveFileName = uniqueId(
            `${this.config.archiveFileKey}/`,
            `-${kebabCase(this.config.exportInfo.name)}.zip`
        );
    }

    s3DownloadStreams(): FileStreamDetails[] {
        const exportInfo = this.config.exportInfo;
        const prefix = uniqueId("", `-${kebabCase(exportInfo.name)}`);
        const files = exportInfo.files.map(({ key }) => {
            return {
                stream: s3Stream.readStream(key),
                filename: `${prefix}\\${this.filesDirName}\\${path.basename(key)}`
            };
        });

        return [
            ...files,
            {
                stream: Readable.from(exportInfo.dataBuffer),
                filename: `${prefix}\\${exportInfo.name}.json`
            }
        ];
    }

    process(): Promise<S3.ManagedUpload.SendData> {
        const { streamPassThrough, streamPassThroughUploadPromise } = s3Stream.writeStream(
            this.archiveFileName
        );

        // 1. Read all files from S3 using stream.
        const s3FilesStreams = this.s3DownloadStreams();

        // 2. Prepare zip from the file stream.
        const archive = vending.create(this.archiveFormat);
        // Handle archive events.
        archive.on("error", (error: ArchiverError) => {
            throw new Error(
                `${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
            );
        });

        // Append all file streams to archive.
        s3FilesStreams.forEach((streamDetails: FileStreamDetails) =>
            archive.append(streamDetails.stream, { name: streamDetails.filename })
        );

        // Pipe archive output to streamPassThrough (Transform Stream) which will be uploaded to S3.
        archive.pipe(streamPassThrough);
        // Finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();

        // 3. Return upload stream promise.
        return streamPassThroughUploadPromise;
    }
}

export class ZipOfZip {
    private readonly archiveFormat = "zip";
    private readonly archiveFileName: string;
    keys: string[];
    filename: string;

    constructor(keys: string[], filename: string) {
        this.keys = keys;
        this.filename = filename;
        this.archiveFileName = uniqueId("", `-${filename}`);
    }

    getFileStreams(): FileStreamDetails[] {
        return this.keys.map(key => {
            return {
                stream: s3Stream.readStream(key),
                filename: `${path.basename(key)}`
            };
        });
    }

    process(): Promise<S3.ManagedUpload.SendData> {
        const { streamPassThrough, streamPassThroughUploadPromise } = s3Stream.writeStream(
            this.archiveFileName
        );

        // 1. Read all files from S3 using stream.
        const fileStreamDetails = this.getFileStreams();

        // 2. Prepare zip from the file stream.
        const archive = vending.create(this.archiveFormat);
        // Handle archive events.
        archive.on("error", (error: ArchiverError) => {
            throw new Error(
                `${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
            );
        });

        // Append all file streams to archive.
        fileStreamDetails.forEach((streamDetails: FileStreamDetails) =>
            archive.append(streamDetails.stream, { name: streamDetails.filename })
        );

        // Pipe archive output to streamPassThrough (Transform Stream) which will be uploaded to S3.
        archive.pipe(streamPassThrough);
        // Finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();

        // 3. Return upload stream promise.
        return streamPassThroughUploadPromise;
    }
}
