import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import {
    MODEL_STORAGE_SYNC_TASK,
    ModelStorageSync,
    type IModelStorageSyncTaskInput
} from "./abstractions.js";

/*
 * The parts of the task controller this task uses. The full controller type is added to api-core
 * by @webiny/background-tasks (module augmentation), which depends on this package, so it can't be
 * imported here.
 */
type Result = TaskDefinition.Result<IModelStorageSyncTaskInput>;
interface ISyncTaskController {
    response: {
        done(message?: string): Result;
        error(error: unknown): Result;
        continue(input: IModelStorageSyncTaskInput): Result;
        aborted(): Result;
    };
    runtime: {
        isAborted(): boolean;
        isCloseToTimeout(seconds?: number): boolean;
    };
}

/* How long one step may start new batches; a batch itself is short (see the storage). */
const STEP_MS = 10_000;

/**
 * Runs the storage's sync for one model until it is done, in steps, continuing in a new run when
 * the current one is close to its timeout. Triggered on a model update (UI models), or with
 * `{ modelId }` through the background tasks `triggerTask` mutation or `TaskService` (code models,
 * after a deploy). Private only hides it from the list of definitions.
 */
class ModelStorageSyncTaskHandlerImpl implements TaskHandler.Interface<IModelStorageSyncTaskInput> {
    public constructor(
        private readonly getModel: GetModelUseCase.Interface,
        private readonly sync?: ModelStorageSync.Interface
    ) {}

    public async run(
        params: TaskHandler.RunParams<IModelStorageSyncTaskInput>
    ): Promise<TaskDefinition.Result<IModelStorageSyncTaskInput>> {
        const { input } = params;
        const controller = params.controller as unknown as ISyncTaskController;
        if (!this.sync) {
            return controller.response.done("The storage needs no sync.");
        }
        const modelResult = await this.getModel.execute(input.modelId);
        if (modelResult.isFail()) {
            return controller.response.error(modelResult.error);
        }
        const model = modelResult.value;

        let cursor = input.cursor ?? null;
        for (;;) {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }
            if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue({ ...input, cursor });
            }
            const result = await this.sync.run(model, {
                cursor,
                deadline: Date.now() + STEP_MS
            });
            if (result.done) {
                return controller.response.done(`Model "${model.modelId}" is in sync.`);
            }
            cursor = result.cursor;
        }
    }
}

const ModelStorageSyncTaskHandler = TaskHandler.createImplementation({
    implementation: ModelStorageSyncTaskHandlerImpl,
    dependencies: [GetModelUseCase, [ModelStorageSync, { optional: true }]]
});

class ModelStorageSyncTask implements TaskDefinition.Interface<IModelStorageSyncTaskInput> {
    public readonly isPrivate = true;
    public readonly id = MODEL_STORAGE_SYNC_TASK;
    public readonly title = "Headless CMS - Sync a model's storage";
    public readonly description =
        "Updates the storage's indexes of a model's entries after the model changed.";
    public readonly maxIterations = 500;
    public readonly databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    public readonly handler = ModelStorageSyncTaskHandler;
}

export const ModelStorageSyncTaskDefinition = TaskDefinition.createImplementation({
    implementation: ModelStorageSyncTask,
    dependencies: []
});
