import { FolderAfterDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import type { FolderAfterDeleteEvent } from "~/features/folder/DeleteFolder/events.js";
import type { IDeleteFlpTaskInput } from "~/types.js";
import { DELETE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

class DeleteFlpOnFolderDeletedHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private tasks: TaskService.Interface) {}

    async handle(event: FolderAfterDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            await this.tasks.trigger<IDeleteFlpTaskInput>({
                definition: DELETE_FLP_TASK_ID,
                input: { folder }
            });
        } catch {
            // Ignore errors
        }
    }
}

export const DeleteFlpOnFolderDeletedHandler = FolderAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFlpOnFolderDeletedHandlerImpl,
    dependencies: [TaskService]
});
