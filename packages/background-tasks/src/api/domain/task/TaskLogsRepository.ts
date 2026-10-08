import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { TaskLogModelProvider, TaskLogsRepository as Abstraction } from "./abstractions.js";
import { entryToTaskLog } from "./entryToTaskLog.js";
import { createRevisionId } from "./createRevisionId.js";
import { BackgroundTaskPersistenceError, TaskLogNotFoundError } from "~/api/domain/errors.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

const toLogError = (error: {
    code?: string;
}): TaskLogNotFoundError | BackgroundTaskPersistenceError => {
    if (error.code === ENTRY_NOT_FOUND) {
        return new TaskLogNotFoundError();
    }
    return BackgroundTaskPersistenceError.from(error);
};

/*
 * Task logs are stored as entries of a private CMS model, and like tasks, they're read and written
 * without authorization.
 */
class TaskLogsRepositoryImpl implements Abstraction.Interface {
    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly modelProvider: TaskLogModelProvider.Interface,
        private readonly getEntryById: GetEntryByIdUseCase.Interface,
        private readonly listLatestEntries: ListLatestEntriesUseCase.Interface,
        private readonly createEntry: CreateEntryUseCase.Interface,
        private readonly updateEntry: UpdateEntryUseCase.Interface,
        private readonly deleteEntry: DeleteEntryUseCase.Interface,
        private readonly whereMapper: CmsWhereMapper.Interface
    ) {}

    async create(
        task: Parameters<Abstraction.Interface["create"]>[0],
        data: Parameters<Abstraction.Interface["create"]>[1]
    ) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.createEntry.execute(model, {
                    values: {
                        ...data,
                        task: task.id
                    }
                });
            });
            if (result.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(result.error));
            }
            return Result.ok(entryToTaskLog(result.value));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async update(id: string, data: Parameters<Abstraction.Interface["update"]>[1]) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.updateEntry.execute(model, createRevisionId(id), {
                    values: data
                });
            });
            if (result.isFail()) {
                return Result.fail(toLogError(result.error));
            }
            return Result.ok(entryToTaskLog(result.value));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async delete(id: string) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.deleteEntry.execute(model, id);
            });
            if (result.isFail()) {
                return Result.fail(toLogError(result.error));
            }
            return Result.ok();
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async get(id: string) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.getEntryById.execute(model, id);
            });
            if (result.isFail()) {
                return Result.fail(toLogError(result.error));
            }
            return Result.ok(entryToTaskLog(result.value));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async getLatest(taskId: string) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.listLatestEntries.execute(model, {
                    where: {
                        values: {
                            task: taskId
                        }
                    },
                    sort: ["createdOn_DESC"],
                    limit: 1
                });
            });
            if (result.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(result.error));
            }
            const [entry] = result.value.entries;
            if (!entry) {
                return Result.fail(new TaskLogNotFoundError());
            }
            return Result.ok(entryToTaskLog(entry));
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }

    async list(params: Parameters<Abstraction.Interface["list"]>[0]) {
        try {
            const result = await this.identityContext.withoutAuthorization(async () => {
                const model = await this.modelProvider.get();
                return this.listLatestEntries.execute(model, {
                    ...params,
                    where: this.whereMapper.map({
                        input: params.where,
                        fields: model.fields
                    })
                });
            });
            if (result.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(result.error));
            }
            const { entries, meta } = result.value;
            return Result.ok({
                items: entries.map(entry => entryToTaskLog(entry)),
                meta
            });
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }
}

export const TaskLogsRepository = Abstraction.createImplementation({
    implementation: TaskLogsRepositoryImpl,
    dependencies: [
        IdentityContext,
        TaskLogModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase,
        CmsWhereMapper
    ]
});
