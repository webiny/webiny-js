import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { DELETE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type IDeleteFlpTaskInput } from "~/types.js";
import { DeleteFlpUseCase } from "~/features/flp/DeleteFlp/index.js";

class DeleteFlpTaskImpl implements TaskDefinition.Interface<IDeleteFlpTaskInput> {
    id = DELETE_FLP_TASK_ID;
    title = "ACO - Delete FLP record";
    description =
        "Synchronizes the FLP catalog by deleting the FLP record based on the provided folder.";
    enableDatabaseLogs = false;

    constructor(private deleteFlp: DeleteFlpUseCase.Interface) {}

    async run({ input, controller }: TaskDefinition.RunParams<IDeleteFlpTaskInput>) {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }

            if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue(input);
            }

            await this.deleteFlp.execute(input.folder);

            return controller.response.done("Task done: FLP record deleted.");
        } catch (error) {
            return controller.response.error(error);
        }
    }
}

export const DeleteFlpTask = TaskDefinition.createImplementation({
    implementation: DeleteFlpTaskImpl,
    dependencies: [DeleteFlpUseCase]
});
