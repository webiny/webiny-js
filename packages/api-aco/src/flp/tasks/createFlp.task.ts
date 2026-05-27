import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type ICreateFlpTaskInput } from "~/types.js";
import { CreateFlpUseCase } from "~/features/flp/CreateFlp/index.js";

class CreateFlpTaskImpl implements TaskDefinition.Interface<ICreateFlpTaskInput> {
    public readonly id = CREATE_FLP_TASK_ID;
    public readonly title = "ACO - Create FLP record";
    public readonly description =
        "Synchronizes the FLP catalog by creating the FLP record based on the provided folder.";
    public readonly databaseLogs = false;
    public readonly isPrivate = true;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(private createFlp: CreateFlpUseCase.Interface) {}

    async run({ input, controller }: TaskDefinition.RunParams<ICreateFlpTaskInput>) {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }

            if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue(input);
            }

            await this.createFlp.execute(input.folder);

            return controller.response.done("Task done: FLP record created.");
        } catch (error) {
            return controller.response.error(error);
        }
    }
}

export const CreateFlpTask = TaskDefinition.createImplementation({
    implementation: CreateFlpTaskImpl,
    dependencies: [CreateFlpUseCase]
});
