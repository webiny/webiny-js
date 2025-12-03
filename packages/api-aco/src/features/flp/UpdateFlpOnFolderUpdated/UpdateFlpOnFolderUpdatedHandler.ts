import { WebinyError } from "@webiny/error";
import type { UpdateFlpUseCase } from "../UpdateFlp/abstractions.js";
import type { FolderAfterUpdateEvent } from "~/features/folders/UpdateFolder/events.js";
import type { IUpdateFlpTaskInput } from "~/types.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { FolderAfterUpdateHandler } from "~/features/folders/UpdateFolder/index.js";
import type { ITasksContextObject } from "@webiny/tasks";

export class UpdateFlpOnFolderUpdatedHandler implements FolderAfterUpdateHandler.Interface {
    constructor(
        private updateFlpUseCase: UpdateFlpUseCase.Interface,
        private tasks?: ITasksContextObject
    ) {}

    async handle(event: FolderAfterUpdateEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            if (this.tasks) {
                await this.tasks.trigger<IUpdateFlpTaskInput>({
                    definition: UPDATE_FLP_TASK_ID,
                    input: { folder }
                });
            } else {
                await this.updateFlpUseCase.execute({ folder });
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing FLP update on folder updated",
                code: "ACO_AFTER_FOLDER_UPDATE_FLP_HANDLER"
            });
        }
    }
}
