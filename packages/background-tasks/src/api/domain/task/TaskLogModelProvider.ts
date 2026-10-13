import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { TaskLogModelProvider as Abstraction } from "./abstractions.js";
import { BackgroundTaskModelNotFoundError } from "~/api/domain/errors.js";
import { WEBINY_TASK_LOG_MODEL_ID } from "~/api/crud/TaskLogPrivateModel.js";

class TaskLogModelProviderImpl implements Abstraction.Interface {
    constructor(private readonly getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WEBINY_TASK_LOG_MODEL_ID);
        if (result.isFail()) {
            throw new BackgroundTaskModelNotFoundError(WEBINY_TASK_LOG_MODEL_ID);
        }
        return result.value;
    }
}

export const TaskLogModelProvider = Abstraction.createImplementation({
    implementation: TaskLogModelProviderImpl,
    dependencies: [GetModelUseCase]
});
