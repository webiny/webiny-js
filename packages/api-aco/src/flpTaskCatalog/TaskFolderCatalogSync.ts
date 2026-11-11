import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { FolderCatalogSync } from "~/features/flp/FolderCatalogSync/abstractions.js";
import type { Folder } from "~/folder/folder.types.js";
import type { ICreateFlpTaskInput, IDeleteFlpTaskInput, IUpdateFlpTaskInput } from "~/types.js";
import { CREATE_FLP_TASK_ID, DELETE_FLP_TASK_ID, UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";

/**
 * Keeps the FLP catalog in step by triggering the FLP tasks.
 *
 * Folder reads report permissions from the FLP records, which the tasks write later. So the create
 * and update tasks, not this class, tell the admin about the change, and they need to know whom to
 * tell. A change rewrites the folder's record and every descendant's.
 *
 * The folder change is already saved, so it stands even when a task cannot be triggered. The logged
 * error is then the only trace of why the catalog is behind.
 */
class TaskFolderCatalogSyncImpl implements FolderCatalogSync.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tasks: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async folderCreated(folder: Folder): Promise<void> {
        await this.trigger<ICreateFlpTaskInput>(
            CREATE_FLP_TASK_ID,
            // Nobody to tell when there is no identity, as in some system calls.
            { folder, notifyIdentityId: this.identityContext.getIdentity()?.id },
            "Could not trigger the task that creates the folder's FLP record."
        );
    }

    async folderUpdated({ folder }: FolderCatalogSync.UpdatedParams): Promise<void> {
        await this.trigger<IUpdateFlpTaskInput>(
            UPDATE_FLP_TASK_ID,
            // Nobody to tell when there is no identity, as in some system calls.
            { folder, notifyIdentityId: this.identityContext.getIdentity()?.id },
            "Could not trigger the task that updates the FLP records of the folder and its subtree."
        );
    }

    async folderDeleted(folder: Folder): Promise<void> {
        await this.trigger<IDeleteFlpTaskInput>(
            DELETE_FLP_TASK_ID,
            { folder },
            "Could not trigger the task that deletes the folder's FLP record."
        );
    }

    private async trigger<TInput extends { folder: Folder }>(
        definition: string,
        input: TInput,
        failureMessage: string
    ): Promise<void> {
        try {
            const result = await this.tasks.trigger<TInput>({ definition, input });
            if (result.isFail()) {
                this.logger.error(
                    { error: result.error, folderId: input.folder.id },
                    failureMessage
                );
            }
        } catch (error) {
            this.logger.error({ error, folderId: input.folder.id }, failureMessage);
        }
    }
}

export const TaskFolderCatalogSync = FolderCatalogSync.createImplementation({
    implementation: TaskFolderCatalogSyncImpl,
    dependencies: [IdentityContext, TaskService, Logger]
});
