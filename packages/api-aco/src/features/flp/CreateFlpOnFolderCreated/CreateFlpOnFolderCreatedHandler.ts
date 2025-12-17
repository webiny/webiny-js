import { CreateFlpUseCase } from "../CreateFlp/abstractions.js";
import { FolderAfterCreateHandler } from "~/features/folder/CreateFolder/abstractions.js";
import type { FolderAfterCreateEvent } from "~/features/folder/CreateFolder/events.js";
import type { ICreateFlpTaskInput } from "~/types.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

class CreateFlpOnFolderCreatedHandlerImpl implements FolderAfterCreateHandler.Interface {
    constructor(
        private createFlpUseCase: CreateFlpUseCase.Interface,
        private tasks?: TaskService.Interface
    ) {}

    async handle(event: FolderAfterCreateEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            if (this.tasks) {
                await this.tasks.trigger<ICreateFlpTaskInput>({
                    definition: CREATE_FLP_TASK_ID,
                    input: { folder }
                });
            } else {
                await this.createFlpUseCase.execute(folder);
            }
        } catch {
            // Ignore errors
        }
    }
}

export const CreateFlpOnFolderCreatedHandler = FolderAfterCreateHandler.createImplementation({
    implementation: CreateFlpOnFolderCreatedHandlerImpl,
    dependencies: [CreateFlpUseCase, [TaskService, { optional: true }]]
});
