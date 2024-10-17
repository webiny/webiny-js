import { ArchiverError, create as createArchiver } from "archiver";
import {
    CompleteMultipartUploadOutput,
    createS3,
    GetObjectCommand
} from "@webiny/aws-sdk/client-s3";
import path from "path";
import { type Readable, Stream } from "stream";
import { Upload } from "@webiny/aws-sdk/lib-storage";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent as HttpsAgent } from "https";
import { Agent as HttpAgent } from "http";

export interface ZipFilesOptions {
    debug?: boolean;
}

export class ZipFiles {
    private readonly bucket: string = process.env.S3_BUCKET as string;
    private debug: boolean = process.env.DEBUG === "true";

    public constructor(options?: ZipFilesOptions) {
        this.setDebug(options?.debug);
    }

    public async process(
        targetFileName: string,
        files: string[]
    ): Promise<CompleteMultipartUploadOutput> {
        const fileNames = Array.from(files);
        const s3Client = createS3({
            requestHandler: new NodeHttpHandler({
                connectionTimeout: 0,
                httpAgent: new HttpAgent({
                    maxSockets: 10000,
                    keepAlive: true,
                    maxFreeSockets: 10000,
                    maxTotalSockets: 10000,
                    keepAliveMsecs: 900000 // milliseconds / 15 minutes
                }),
                httpsAgent: new HttpsAgent({
                    maxSockets: 10000,
                    keepAlive: true,
                    sessionTimeout: 900, // seconds / 15 minutes
                    maxCachedSessions: 100000,
                    maxFreeSockets: 10000,
                    maxTotalSockets: 10000,
                    keepAliveMsecs: 900000 // milliseconds / 15 minutes
                }),
                requestTimeout: 900000 // milliseconds / 15 minutes
            })
        });

        const streamPassThrough = new Stream.PassThrough({
            autoDestroy: true
        });

        const upload = new Upload({
            client: s3Client,
            params: {
                ACL: "private",
                Body: streamPassThrough,
                Bucket: this.bucket,
                ContentType: "application/zip",
                Key: targetFileName
            },
            queueSize: 1,
            partSize: 1024 * 1024 * 5,
            leavePartsOnError: false
        });

        const archive = createArchiver("zip", {});

        archive.on("error", (error: ArchiverError) => {
            console.error(error);
            throw new Error(
                `${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
            );
        });

        archive.pipe(streamPassThrough);

        /**
         * To combine all the files into a single zip file, we need to add files one by one.
         *
         * addFileToArchive() method is called every time an entry event is triggered on the archive - it means that file was added into the archive.
         * The method is called manually, first time, to start the process.
         */

        archive.on("entry", data => {
            this.debug && console.log(`Archived file: ${data.name}`);
            addFileToArchive();
        });

        const addFileToArchive = async (): Promise<void> => {
            const file = fileNames.shift();
            if (!file) {
                this.debug && console.log("No more files to add to the archive.");
                /**
                 * Must call finalize() with a timeout, otherwise the lambda crashes.
                 */
                setTimeout(() => {
                    archive.finalize();
                }, 200);
                return;
            }
            this.debug && console.log(`Adding file "${file}" to the archive.`);
            const cmd = new GetObjectCommand({
                Bucket: this.bucket,
                Key: file
            });

            const response = await s3Client.send(cmd);
            // Possible to get a null response.Body?
            // Typescript says yes, so let's check it.
            if (!response.Body) {
                this.debug &&
                    console.log(`No response.Body for file "${file}", moving to next file.`);
                return addFileToArchive();
            }
            const name = `${path.basename(file)}`;

            archive.append(response.Body as Readable, {
                name
            });
        };

        addFileToArchive();

        const result = await upload.done();

        s3Client.destroy();
        return result;
    }

    private setDebug(debug?: boolean): void {
        if (debug === undefined) {
            return;
        }
        this.debug = debug;
    }
}
