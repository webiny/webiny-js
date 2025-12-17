import { DeleteFlpUseCase } from "../DeleteFlp/abstractions.js";
import { FolderAfterDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import type { FolderAfterDeleteEvent } from "~/features/folders/DeleteFolder/events.js";
import type { IDeleteFlpTaskInput } from "~/types.js";
import { DELETE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

class DeleteFlpOnFolderDeletedHandlerImpl implements FolderAfterDeleteHandler.Interface {
    constructor(
        private deleteFlpUseCase: DeleteFlpUseCase.Interface,
        private tasks?: TaskService.Interface
    ) {}

    async handle(event: FolderAfterDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            if (this.tasks) {
                await this.tasks.trigger<IDeleteFlpTaskInput>({
                    definition: DELETE_FLP_TASK_ID,
                    input: { folder }
                });
            } else {
                await this.deleteFlpUseCase.execute(folder);
            }
        } catch {
            // Ignore errors
        }
    }
}

export const DeleteFlpOnFolderDeletedHandler = FolderAfterDeleteHandler.createImplementation({
    implementation: DeleteFlpOnFolderDeletedHandlerImpl,
    dependencies: [DeleteFlpUseCase, [TaskService, { optional: true }]]
});
