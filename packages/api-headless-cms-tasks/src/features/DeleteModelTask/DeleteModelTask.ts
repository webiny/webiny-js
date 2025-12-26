import type { IDeleteModelTaskInput } from "./types.js";
import type { IDeleteModelTaskOutput } from "./types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { DELETE_MODEL_TASK } from "~/constants.js";

type IRunParams = TaskDefinition.RunParams<IDeleteModelTaskInput, IDeleteModelTaskOutput>;

class DeleteModelTaskDefinition
    implements TaskDefinition.Interface<IDeleteModelTaskInput, IDeleteModelTaskOutput>
{
    id = DELETE_MODEL_TASK;
    title = "Delete model and all of the entries";
    maxIterations = 50;
    isPrivate = true;
    disableDatabaseLogs = true;
    description = "Delete a content model and all associated entries.";

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

export const DeleteModelTask = TaskDefinition.createImplementation({
    implementation: DeleteModelTaskDefinition,
    dependencies: [CmsContext]
});
