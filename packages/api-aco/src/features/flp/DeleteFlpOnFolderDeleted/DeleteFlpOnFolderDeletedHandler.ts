import { FolderAfterDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import type { FolderAfterDeleteEvent } from "~/features/folder/DeleteFolder/events.js";
import type { IDeleteFlpTaskInput } from "~/types.js";
import { DELETE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";

class DeleteFlpOnFolderDeletedHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(
        private tasks: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: FolderAfterDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            const result = await this.tasks.trigger<IDeleteFlpTaskInput>({
                definition: DELETE_FLP_TASK_ID,
                input: { folder }
            });
            if (result.isFail()) {
                this.logFailure(folder.id, result.error);
            }
        } catch (error) {
            this.logFailure(folder.id, error);
        }
    }

    /*
     * The folder change is already saved, so it stands. But the folder's FLP record is left behind,
     * and this log is the only trace of why.
     */
    private logFailure(folderId: string, error: unknown): void {
        this.logger.error(
            { error, folderId },
            "Could not trigger the task that deletes the folder's FLP record."
        );
    }
}

export const DeleteFlpOnFolderDeletedHandler = FolderAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFlpOnFolderDeletedHandlerImpl,
    dependencies: [TaskService, Logger]
});
