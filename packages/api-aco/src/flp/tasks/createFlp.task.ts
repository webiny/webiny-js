import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type ICreateFlpTaskInput } from "~/types.js";
import { CreateFlpUseCase } from "~/features/flp/CreateFlp/index.js";
import { NotifyFolderChangeUseCase } from "~/features/folder/NotifyFolderChange/index.js";

class CreateFlpTaskHandlerImpl implements TaskHandler.Interface<ICreateFlpTaskInput> {
    constructor(
        private createFlp: CreateFlpUseCase.Interface,
        private notifyFolderChange: NotifyFolderChangeUseCase.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<ICreateFlpTaskInput>) {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }

            if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue(input);
            }

            await this.createFlp.execute(input.folder);

            // Only now can the admin read the folder back with its permissions.
            if (input.notifyIdentityId) {
                await this.notifyFolderChange.execute({
                    id: input.folder.id,
                    change: "created",
                    identityId: input.notifyIdentityId
                });
            }

            return controller.response.done("Task done: FLP record created.");
        } catch (error) {
            return controller.response.error(error);
        }
    }
}

const CreateFlpTaskHandler = TaskHandler.createImplementation({
    implementation: CreateFlpTaskHandlerImpl,
    dependencies: [CreateFlpUseCase, NotifyFolderChangeUseCase]
});

class CreateFlpTaskImpl implements TaskDefinition.Interface {
    public readonly id = CREATE_FLP_TASK_ID;
    public readonly title = "ACO - Create FLP record";
    public readonly description =
        "Synchronizes the FLP catalog by creating the FLP record based on the provided folder.";
    public readonly databaseLogs = false;
    public readonly isPrivate = true;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = CreateFlpTaskHandler;
}

export const CreateFlpTask = TaskDefinition.createImplementation({
    implementation: CreateFlpTaskImpl,
    dependencies: []
});
