import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { DeleteS3FolderInput } from "~/features/DeleteFileFromBucket/DeleteS3FolderTask.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

class DeleteFileFromBucketHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private taskService: TaskService.Interface,
        private keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        const tenant = this.tenantContext.getTenant();

        // Delete S3 folder recursively
        await this.taskService.trigger<DeleteS3FolderInput>({
            definition: "fileManagerFolderDelete",
            input: {
                caller: "fm-after-delete",
                bucket: String(process.env.S3_BUCKET),
                folderKey: `tenants/${tenant.id}/files/${file.id}`
            }
        });

        // Delete file metadata
        await this.keyValueStore.delete(`FileManager/File/${file.id}/Metadata`);
    }
}

export const DeleteFileFromBucketHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFileFromBucketHandlerImpl,
    dependencies: [TenantContext, TaskService, GlobalKeyValueStore]
});
