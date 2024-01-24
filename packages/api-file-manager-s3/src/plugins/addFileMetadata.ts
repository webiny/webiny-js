import { S3 } from "@webiny/aws-sdk/client-s3";
import { ContextPlugin } from "@webiny/api";
import { FileManagerContext, File } from "@webiny/api-file-manager/types";
import { executeWithRetry } from "@webiny/utils";

export class MetadataWriter {
    private readonly bucket: string;

    constructor(bucket: string) {
        this.bucket = bucket;
    }

    async write(files: File[]) {
        const s3 = this.getS3();

        /**
         * We need to write each file with retry.
         */
        const writers = files.map(file => {
            const writer = () => {
                return s3.putObject({
                    Bucket: this.bucket,
                    Key: `${file.key}.metadata`,
                    Body: JSON.stringify(this.getMetadata(file)),
                    ContentType: "application/json",
                    CacheControl: "max-age=31536000"
                });
            };

            return executeWithRetry(writer);
        });

        await Promise.all(writers);
    }

    private getS3() {
        return new S3({ region: process.env.AWS_REGION });
    }

    private getMetadata(file: File) {
        return {
            id: file.id,
            tenant: file.tenant,
            locale: file.locale,
            size: file.size,
            contentType: file.type
        };
    }
}

export const addFileMetadata = () => {
    return new ContextPlugin<FileManagerContext>(context => {
        const metadataWriter = new MetadataWriter(String(process.env.S3_BUCKET));

        context.fileManager.onFileAfterCreate.subscribe(({ file }) => {
            return metadataWriter.write([file]);
        });

        context.fileManager.onFileAfterBatchCreate.subscribe(({ files }) => {
            return metadataWriter.write(files);
        });
    });
};
