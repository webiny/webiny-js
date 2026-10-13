import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { FolderAfterUpdateEvent } from "~/features/folder/UpdateFolder/events.js";
import type { IUpdateFlpTaskInput } from "~/types.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { FolderAfterUpdateEventHandler } from "~/features/folder/UpdateFolder/index.js";

/*
 * Folder reads report permissions from the FLP records, and a change rewrites the folder's record
 * and every descendant's. The task does that later, so it also tells the admin once all of them are
 * written, and it needs to know whom to tell.
 */
class UpdateFlpOnFolderUpdatedHandlerImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tasks: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: FolderAfterUpdateEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            const result = await this.tasks.trigger<IUpdateFlpTaskInput>({
                definition: UPDATE_FLP_TASK_ID,
                // Nobody to tell when there is no identity, as in some system calls.
                input: { folder, notifyIdentityId: this.identityContext.getIdentity()?.id }
            });
            if (result.isFail()) {
                this.logFailure(folder.id, result.error);
            }
        } catch (error) {
            this.logFailure(folder.id, error);
        }
    }

    /*
     * The folder change is already saved, so it stands. But the FLP records of the folder and its
     * subtree keep the old permissions, and this log is the only trace of why.
     */
    private logFailure(folderId: string, error: unknown): void {
        this.logger.error(
            { error, folderId },
            "Could not trigger the task that updates the FLP records of the folder and its subtree."
        );
    }
}

export const UpdateFlpOnFolderUpdatedHandler = FolderAfterUpdateEventHandler.createImplementation({
    implementation: UpdateFlpOnFolderUpdatedHandlerImpl,
    dependencies: [IdentityContext, TaskService, Logger]
});
