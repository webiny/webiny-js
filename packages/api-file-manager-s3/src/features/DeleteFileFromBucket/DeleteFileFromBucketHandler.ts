import { dirname } from "path";
import { FileAfterDeleteHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { DeleteS3FolderInput } from "~/features/DeleteFileFromBucket/DeleteS3FolderTask.js";

class DeleteFileFromBucketHandlerImpl implements FileAfterDeleteHandler.Interface {
    constructor(private taskService: TaskService.Interface) {}

    async handle(event: FileAfterDeleteHandler.Event): Promise<void> {
        const { file } = event.payload;

        // Delete S3 folder recursively
        await this.taskService.trigger<DeleteS3FolderInput>({
            definition: "fileManagerFolderDelete",
            input: {
                caller: "fm-after-delete",
                bucket: String(process.env.S3_BUCKET),
                folderKey: dirname(file.key)
            }
        });
    }
}

export const DeleteFileFromBucketHandler = FileAfterDeleteHandler.createImplementation({
    implementation: DeleteFileFromBucketHandlerImpl,
    dependencies: [TaskService]
});
