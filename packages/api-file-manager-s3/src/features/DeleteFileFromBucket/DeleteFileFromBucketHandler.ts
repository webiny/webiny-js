import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { FileAfterDeleteHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";

const S3_BUCKET = process.env.S3_BUCKET;

class DeleteFileFromBucketHandlerImpl implements FileAfterDeleteHandler.Interface {
    async handle(event: FileAfterDeleteHandler.Event): Promise<void> {
        const { file } = event.payload;
        const { key } = file;

        if (!key || !S3_BUCKET) {
            return;
        }

        const s3 = new S3();

        await s3.deleteObject({
            Bucket: S3_BUCKET,
            Key: key
        });
    }
}

export const DeleteFileFromBucketHandler = FileAfterDeleteHandler.createImplementation({
    implementation: DeleteFileFromBucketHandlerImpl,
    dependencies: []
});
