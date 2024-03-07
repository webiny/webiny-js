import vending, { ArchiverError } from "archiver";
import {
    CompleteMultipartUploadOutput,
    createS3Client,
    GetObjectCommand,
    PutObjectCommandInput
} from "@webiny/aws-sdk/client-s3";
import uniqueId from "uniqid";
import path from "path";
import { type Readable, Stream } from "stream";
import { Upload } from "@webiny/aws-sdk/lib-storage";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";

export class CombineZipFiles {
    private readonly bucket: string = process.env.S3_BUCKET as string;

    public async process(
        filename: string,
        files: string[]
    ): Promise<CompleteMultipartUploadOutput> {
        const s3Client = createS3Client({
            requestHandler: new NodeHttpHandler({
                httpsAgent: new Agent({
                    maxSockets: 500,
                    keepAlive: true,
                    keepAliveMsecs: 720000 // milliseconds / 12 minutes
                }),
                requestTimeout: 720000 // milliseconds / 12 minutes
            })
        });

        const archiveFileName = uniqueId("EXPORTS/", `-${filename}`);
        const streamPassThrough = new Stream.PassThrough({
            autoDestroy: true
        });

        const params: PutObjectCommandInput = {
            ACL: "private",
            Body: streamPassThrough,
            Bucket: this.bucket,
            ContentType: "application/zip",
            Key: archiveFileName
        };

        const upload = new Upload({
            client: s3Client,
            params,
            queueSize: 1
        });

        const archive = vending.create("zip", {});

        archive.on("error", (error: ArchiverError) => {
            throw new Error(
                `${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`
            );
        });

        // Pipe archive output to streamPassThrough (Transform Stream) which will be uploaded to S3.
        archive.pipe(streamPassThrough);

        for (const index in files) {
            const file = files[index];
            const cmd = new GetObjectCommand({
                Bucket: this.bucket,
                Key: file
            });

            const response = await s3Client.send(cmd);
            const stream = response.Body as Readable;

            const name = `${path.basename(file)}`;

            archive.append(stream, {
                name
            });
        }
        // Finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        // IMPORTANT: there is no await here because it kills the lambda execution
        archive.finalize();

        // 3. Return upload stream promise.
        const result = await upload.done();

        s3Client.destroy();
        return result;
    }
}
