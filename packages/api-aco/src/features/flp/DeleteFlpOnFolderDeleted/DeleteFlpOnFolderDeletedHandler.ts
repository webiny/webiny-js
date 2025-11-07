import { WebinyError } from "@webiny/error";
import type { DeleteFlpUseCase } from "../DeleteFlp/abstractions.js";
import { FolderAfterDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import type { FolderAfterDeleteEvent } from "~/features/folders/DeleteFolder/events.js";
import type { IDeleteFlpTaskInput } from "~/types.js";
import { DELETE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import type { ITasksContextObject } from "@webiny/tasks";

export class DeleteFlpOnFolderDeletedHandler implements FolderAfterDeleteHandler.Interface {
    constructor(
        private deleteFlpUseCase: DeleteFlpUseCase.Interface,
        private tasks?: ITasksContextObject
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
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing FLP deletion on folder deleted",
                code: "ACO_AFTER_FOLDER_DELETE_FLP_HANDLER"
            });
        }
    }
}
