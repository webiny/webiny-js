import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface DeleteS3FolderInput {
    /**
     * Caller of the task (e.g., `fm-after-delete`).
     */
    caller: string;
    /**
     * Cache paths to invalidate.
     */
    bucket: string;
    /**
     * FM file directory key to delete.
     */
    folderKey: string;
    /**
     * Continuation token for pagination.
     */
    continuationToken?: string;
}

class DeleteS3FolderTask implements TaskDefinition.Interface<DeleteS3FolderInput> {
    id = "fileManagerFolderDelete";
    title = "Delete folder and all of its contents from the bucket.";
    description = "A task to delete all files from a given folder.";
    maxIterations = 5;
    isPrivate = true;

    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    public async run({
        input,
        controller
    }: TaskDefinition.RunParams<DeleteS3FolderInput>): Promise<
        TaskDefinition.Result<DeleteS3FolderInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        if (!input.bucket) {
            return controller.response.error({ message: `Bucket is not defined.` });
        }

        const s3 = new S3();

        // List objects in the folder with pagination support.
        const filesList = await s3.listObjectsV2({
            Bucket: input.bucket,
            Prefix: `${input.folderKey}/`,
            ContinuationToken: input.continuationToken
        });

        // Delete all files in the folder using batch delete.
        if (filesList.Contents && filesList.Contents.length > 0) {
            const objectsToDelete = filesList.Contents.filter(file => file.Key).map(file => ({
                Key: file.Key!
            }));

            if (objectsToDelete.length > 0) {
                await s3.deleteObjects({
                    Bucket: input.bucket,
                    Delete: {
                        Objects: objectsToDelete
                    }
                });
            }
        }

        // If there are more objects to delete, continue in the next iteration.
        if (filesList.IsTruncated && filesList.NextContinuationToken) {
            return controller.response.continue({
                ...input,
                continuationToken: filesList.NextContinuationToken
            });
        }

        return controller.response.done();
    }
}

export const DeleteS3FolderTaskDefinition = TaskDefinition.createImplementation({
    implementation: DeleteS3FolderTask,
    dependencies: []
});
