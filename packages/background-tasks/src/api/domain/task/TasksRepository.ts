import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { TaskModelProvider, TasksRepository as Abstraction } from "./abstractions.js";
import { entryToTask } from "./entryToTask.js";
import { createRevisionId } from "./createRevisionId.js";
import { BackgroundTaskPersistenceError, TaskNotFoundError } from "~/api/domain/errors.js";
import { TaskDataStatus } from "~/api/types.js";
import type { IListTaskParams, ITaskCreateData, ITaskUpdateData } from "~/api/types.js";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

const toTaskError = (error: {
    code?: string;
}): TaskNotFoundError | BackgroundTaskPersistenceError => {
    if (error.code === ENTRY_NOT_FOUND) {
        return new TaskNotFoundError();
    }
    return BackgroundTaskPersistenceError.from(error);
};

/*
 * Tasks are stored as entries of a private CMS model. The calls run without authorization: who may
 * see or run a task is decided by the task use cases and the GraphQL layer, not by CMS permissions.
 */
class TasksRepositoryImpl implements Abstraction.Interface {
    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly modelProvider: TaskModelProvider.Interface,
        private readonly getEntryById: GetEntryByIdUseCase.Interface,
        private readonly listLatestEntries: ListLatestEntriesUseCase.Interface,
        private readonly createEntry: CreateEntryUseCase.Interface,
        private readonly updateEntry: UpdateEntryUseCase.Interface,
        private readonly deleteEntry: DeleteEntryUseCase.Interface,
        private readonly whereMapper: CmsWhereMapper.Interface
    ) {}

    async get<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(id: string) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.getEntryById.execute(model, createRevisionId(id));
            });
            if (result.isFail()) {
                return Result.fail(toTaskError(result.error));
            }
            return Result.ok(entryToTask<I, O>(result.value));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async list<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        params?: IListTaskParams
    ) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.listLatestEntries.execute(model, {
                    ...params,
                    where: this.whereMapper.map({
                        input: params?.where,
                        fields: model.fields
                    })
                });
            });
            if (result.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(result.error));
            }
            const { entries, meta } = result.value;
            return Result.ok({
                items: entries.map(entry => entryToTask<I, O>(entry)),
                meta
            });
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async create<I extends TaskInput = TaskInput>(data: ITaskCreateData<I>) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.createEntry.execute(model, {
                    values: {
                        ...data,
                        iterations: 0,
                        taskStatus: TaskDataStatus.PENDING
                    }
                });
            });
            if (result.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(result.error));
            }
            return Result.ok(entryToTask<I>(result.value));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async update<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        id: string,
        data: Partial<ITaskUpdateData<I, O>>
    ) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.updateEntry.execute(model, createRevisionId(id), {
                    values: { ...data }
                });
            });
            if (result.isFail()) {
                return Result.fail(toTaskError(result.error));
            }
            return Result.ok(entryToTask<I, O>(result.value));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async delete(id: string) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.deleteEntry.execute(model, createRevisionId(id));
            });
            if (result.isFail()) {
                return Result.fail(toTaskError(result.error));
            }
            return Result.ok();
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }
}

export const TasksRepository = Abstraction.createImplementation({
    implementation: TasksRepositoryImpl,
    dependencies: [
        IdentityContext,
        TaskModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase,
        CmsWhereMapper
    ]
});
