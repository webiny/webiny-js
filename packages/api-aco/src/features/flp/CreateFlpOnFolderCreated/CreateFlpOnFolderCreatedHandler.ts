import { CreateFlpUseCase } from "../CreateFlp/abstractions.js";
import { FolderAfterCreateEventHandler } from "~/features/folder/CreateFolder/abstractions.js";
import type { FolderAfterCreateEvent } from "~/features/folder/CreateFolder/events.js";
import type { ICreateFlpTaskInput } from "~/types.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

class CreateFlpOnFolderCreatedHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(
        private createFlpUseCase: CreateFlpUseCase.Interface,
        private tasks?: TaskService.Interface
    ) {}

    async handle(event: FolderAfterCreateEvent): Promise<void> {
        const { folder } = event.payload;

        /* Create the FLP record right away. Until it exists, the folder's permissions load as
           empty, which means "public": anyone with access to the app could read the folder
           or change its permissions. It's a single write, so there's no need for a task. */
        try {
            await this.createFlpUseCase.execute(folder);
            return;
        } catch {
            // Fall back to the background task, which retries outside of this request.
        }

        try {
            if (this.tasks) {
                await this.tasks.trigger<ICreateFlpTaskInput>({
                    definition: CREATE_FLP_TASK_ID,
                    input: { folder }
                });
            }
        } catch {
            // Ignore errors
        }
    }
}

export const CreateFlpOnFolderCreatedHandler = FolderAfterCreateEventHandler.createImplementation({
    implementation: CreateFlpOnFolderCreatedHandlerImpl,
    dependencies: [CreateFlpUseCase, [TaskService, { optional: true }]]
});
