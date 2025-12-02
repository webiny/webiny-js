import { WebinyError } from "@webiny/error";
import type { CreateFlpUseCase } from "../CreateFlp/abstractions.js";
import { FolderAfterCreateHandler } from "~/features/folders/CreateFolder/abstractions.js";
import type { FolderAfterCreateEvent } from "~/features/folders/CreateFolder/events.js";
import type { ICreateFlpTaskInput } from "~/types.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";

interface Tasks {
    trigger: <T>(params: { definition: string; input: T }) => Promise<void>;
}

export class CreateFlpOnFolderCreatedHandler implements FolderAfterCreateHandler.Interface {
    constructor(
        private createFlpUseCase: CreateFlpUseCase.Interface,
        private tasks?: Tasks
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
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing FLP creation on folder created",
                code: "ACO_AFTER_FOLDER_CREATE_FLP_HANDLER"
            });
        }
    }
}
