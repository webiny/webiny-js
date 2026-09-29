import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { DELETE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type IDeleteFlpTaskInput } from "~/types.js";
import { DeleteFlpUseCase } from "~/features/flp/DeleteFlp/index.js";

class DeleteFlpTaskHandlerImpl implements TaskHandler.Interface<IDeleteFlpTaskInput> {
    constructor(private deleteFlp: DeleteFlpUseCase.Interface) {}

    async run({ input, controller }: TaskHandler.RunParams<IDeleteFlpTaskInput>) {
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

const DeleteFlpTaskHandler = TaskHandler.createImplementation({
    implementation: DeleteFlpTaskHandlerImpl,
    dependencies: [DeleteFlpUseCase]
});

class DeleteFlpTaskImpl implements TaskDefinition.Interface {
    public readonly id = DELETE_FLP_TASK_ID;
    public readonly title = "ACO - Delete FLP record";
    public readonly description =
        "Synchronizes the FLP catalog by deleting the FLP record based on the provided folder.";
    public readonly databaseLogs = false;
    public readonly isPrivate = true;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = DeleteFlpTaskHandler;
}

export const DeleteFlpTask = TaskDefinition.createImplementation({
    implementation: DeleteFlpTaskImpl,
    dependencies: []
});
