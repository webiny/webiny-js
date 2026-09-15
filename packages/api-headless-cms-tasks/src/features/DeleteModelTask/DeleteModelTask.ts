import type { IDeleteModelTaskInput } from "./types.js";
import type { IDeleteModelTaskOutput } from "./types.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { DELETE_MODEL_TASK } from "~/constants.js";

type IRunParams = TaskHandler.RunParams<IDeleteModelTaskInput, IDeleteModelTaskOutput>;

class DeleteModelTaskDefinitionHandlerImpl implements TaskHandler.Interface<
    IDeleteModelTaskInput,
    IDeleteModelTaskOutput
> {
    constructor(private context: CmsContext.Interface) {}

    async run(params: IRunParams) {
        const { DeleteModel } = await import(
            /* webpackChunkName: "createDeleteModel" */ "./DeleteModel.js"
        );

        try {
            const runner = new DeleteModel(this.context);
            return await runner.run(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }

    createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
        return {
            modelId: validator.string(),
            lastDeletedId: validator.string().optional()
        };
    }
}

const DeleteModelTaskDefinitionHandler = TaskHandler.createImplementation({
    implementation: DeleteModelTaskDefinitionHandlerImpl,
    dependencies: [CmsContext]
});

class DeleteModelTaskDefinition implements TaskDefinition.Interface {
    id = DELETE_MODEL_TASK;
    title = "Delete model and all of the entries";
    maxIterations = 50;
    isPrivate = true;
    databaseLogs = false;
    description = "Delete a content model and all associated entries.";

    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = DeleteModelTaskDefinitionHandler;
}

export const DeleteModelTask = TaskDefinition.createImplementation({
    implementation: DeleteModelTaskDefinition,
    dependencies: []
});
