import WebinyError from "@webiny/error";
import type { Container } from "@webiny/di";
import type {
    IListTaskLogParams,
    IListTaskParams,
    ITaskCreateData,
    ITaskLog,
    ITaskLogCreateInput,
    ITaskLogUpdateInput,
    ITasksContextCrudObject,
    ITaskUpdateData
} from "~/api/types.js";
import { TaskDataStatus } from "~/api/types.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import { WEBINY_TASK_MODEL_ID } from "./TaskPrivateModel.js";
import { WEBINY_TASK_LOG_MODEL_ID } from "./TaskLogPrivateModel.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { NotFoundError } from "@webiny/api-graphql";
import { createZodError, parseIdentifier } from "@webiny/utils";
import zod from "zod";
import type { GenericRecord } from "@webiny/api/types.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    TaskDefinitionNotFoundError,
    TaskLogNotFoundError,
    TaskNotFoundError
} from "~/api/domain/errors.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    TaskAfterCreateEvent,
    TaskAfterDeleteEvent,
    TaskAfterUpdateEvent,
    TaskBeforeCreateEvent,
    TaskBeforeDeleteEvent,
    TaskBeforeUpdateEvent
} from "~/api/events/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { createCleanupTaskSubtree } from "./cleanupTaskSubtree.js";

const createRevisionId = (id: string) => {
    const { id: entryId } = parseIdentifier(id);
    return `${entryId}#0001`;
};

const convertToTask = <
    T extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
>(
    entry: CmsEntry<TaskService.Task<T, O>>
): TaskService.Task<T, O> => {
    return {
        id: entry.entryId,
        createdOn: entry.createdOn,
        savedOn: entry.savedOn,
        createdBy: entry.createdBy,
        name: entry.values.name,
        definitionId: entry.values.definitionId,
        input: entry.values.input,
        output: entry.values.output,
        taskStatus: entry.values.taskStatus,
        executionName: entry.values.executionName || "",
        eventResponse: entry.values.eventResponse,
        startedOn: entry.values.startedOn,
        finishedOn: entry.values.finishedOn,
        iterations: entry.values.iterations,
        parentId: entry.values.parentId
    };
};

const convertToLog = (entry: CmsEntry<ITaskLog>): ITaskLog => {
    return {
        id: entry.entryId,
        createdOn: entry.createdOn,
        createdBy: entry.createdBy,
        executionName: entry.values.executionName,
        task: entry.values.task,
        iteration: entry.values.iteration,
        items: entry.values.items || []
    };
};

interface IValidateParams {
    definition: Pick<TaskDefinition.Runnable, "createInputValidation">;
    data: Pick<ITaskCreateData, "input">;
}

const getZodSchema = (schema: GenericRecord<string, zod.ZodTypeAny> | zod.ZodTypeAny) => {
    if (!schema) {
        return zod.looseObject({});
    } else if (schema instanceof zod.ZodObject) {
        return schema.loose();
    } else if (schema instanceof zod.ZodType) {
        return schema;
    }
    return zod.looseObject(schema);
};

const validateTaskInput = async (params: IValidateParams) => {
    const { definition, data } = params;
    if (!definition.createInputValidation) {
        return;
    }
    const schema = definition.createInputValidation({
        validator: zod
    });
    /**
     * If the schema is not an object, we need to wrap it with the `object` function.
     */
    const validate = getZodSchema(schema);

    const result = await validate.safeParseAsync(data.input);
    if (result.success) {
        return;
    }
    throw createZodError(result.error);
};

export const createTaskCrud = (container: Container): ITasksContextCrudObject => {
    // Resolved lazily (inside listTasks/listLogs) rather than at build time — the factory is now
    // invoked from BackgroundTasksFeature.register, which may run before CmsWhereMapper is registered.
    const getCmsWhereMapper = () => container.resolve(CmsWhereMapper);

    const getTaskModel = async (): Promise<CmsModel> => {
        const identityContext = container.resolve(IdentityContext);
        return await identityContext.withoutAuthorization(async () => {
            const getModel = container.resolve(GetModelUseCase);
            const result = await getModel.execute(WEBINY_TASK_MODEL_ID);
            if (result.isFail()) {
                throw new WebinyError(`There is no model "${WEBINY_TASK_MODEL_ID}".`);
            }
            return result.value;
        });
    };

    const getLogModel = async (): Promise<CmsModel> => {
        const identityContext = container.resolve(IdentityContext);
        return await identityContext.withoutAuthorization(async () => {
            const getModel = container.resolve(GetModelUseCase);
            const result = await getModel.execute(WEBINY_TASK_LOG_MODEL_ID);
            if (result.isFail()) {
                throw new WebinyError(`There is no model "${WEBINY_TASK_LOG_MODEL_ID}".`);
            }
            return result.value;
        });
    };

    /*
     * Reads through the same query path `listTasks` uses, rather than fetching the entry by id.
     *
     * This is a workaround, not a design. Fetching a CMS entry by id goes through a DataLoader that
     * is registered in singleton scope, so in Lambda it memoises per warm container and a task
     * written by the background-task function is served stale to the GraphQL function for that
     * container's whole life — `getTask` reported `pending` for a task that had finished seven
     * minutes earlier, and a failed task reported `running` with no error, while `listTasks` was
     * correct throughout. Two readers of one record disagreeing is the bug; routing both through the
     * same reader is what makes them agree.
     *
     * The real fix is per-request scoping of that DataLoader, which is core CMS and affects every
     * entry fetched by id — see the issue filed against @webiny/api-headless-cms-ddb. Remove this
     * and restore the by-id read when that lands, rather than leaving it in place permanently.
     */
    const getTask = async <
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string
    ) => {
        const revisionId = createRevisionId(id);
        const { items } = await listTasks<T, O>({ where: { id: revisionId }, limit: 1 });

        const task = items[0];
        if (!task) {
            return null;
        }

        /*
         * The filter is on the revision id while a task's own id is the entry id, so the match is
         * confirmed rather than assumed: a where clause that silently stopped filtering would
         * otherwise hand back whichever task happened to be first.
         */
        const { id: entryId } = parseIdentifier(revisionId);
        if (task.id !== entryId) {
            return null;
        }

        return task;
    };

    const listTasks = async <
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params?: IListTaskParams
    ) => {
        const identityContext = container.resolve(IdentityContext);
        const { entries, meta } = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const listLatestEntries = container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<TaskService.Task<T, O>>(model, {
                ...params,
                where: getCmsWhereMapper().map({
                    input: params?.where,
                    fields: model.fields
                })
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return {
            items: entries.map(item => convertToTask<T, O>(item)),
            meta
        };
    };

    const createTask = async (data: ITaskCreateData) => {
        const definition = container.resolve(TasksCrud).getDefinition(data.definitionId);
        if (!definition) {
            throw new TaskDefinitionNotFoundError(data.definitionId);
        }

        await validateTaskInput({
            definition,
            data
        });

        const identityContext = container.resolve(IdentityContext);
        const eventPublisher = container.resolve(EventPublisher);

        const beforeCreateEvent = new TaskBeforeCreateEvent({
            input: data
        });
        await eventPublisher.publish(beforeCreateEvent);

        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const createEntry = container.resolve(CreateEntryUseCase);
            return createEntry.execute(model, {
                values: {
                    ...data,
                    iterations: 0,
                    taskStatus: TaskDataStatus.PENDING
                }
            });
        });

        if (result.isFail()) {
            throw result.error;
        }

        const task = convertToTask(result.value as unknown as CmsEntry<TaskService.Task>);

        const afterCreateEvent = new TaskAfterCreateEvent({
            input: data,
            task
        });
        await eventPublisher.publish(afterCreateEvent);

        return task;
    };

    const updateTask = async <
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string,
        data: ITaskUpdateData<T, O>
    ) => {
        const original = await getTask<T, O>(id);
        if (!original) {
            throw new TaskNotFoundError();
        }

        const identityContext = container.resolve(IdentityContext);
        const eventPublisher = container.resolve(EventPublisher);

        const beforeUpdateEvent = new TaskBeforeUpdateEvent({
            input: data,
            original
        });
        await eventPublisher.publish(beforeUpdateEvent);

        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const updateEntry = container.resolve(UpdateEntryUseCase);
            return updateEntry.execute(model, createRevisionId(id), {
                values: {
                    ...data
                }
            });
        });

        if (result.isFail()) {
            throw result.error;
        }

        const task = convertToTask<T, O>(
            result.value as unknown as CmsEntry<TaskService.Task<T, O>>
        );

        const afterUpdateEvent = new TaskAfterUpdateEvent({
            input: data,
            task
        });
        await eventPublisher.publish(afterUpdateEvent);

        return task;
    };

    const deleteTask = async (id: string) => {
        const task = await getTask(id);
        if (!task) {
            throw new TaskNotFoundError();
        }

        const identityContext = container.resolve(IdentityContext);
        const eventPublisher = container.resolve(EventPublisher);

        const beforeDeleteEvent = new TaskBeforeDeleteEvent({
            task
        });
        await eventPublisher.publish(beforeDeleteEvent);

        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const deleteEntry = container.resolve(DeleteEntryUseCase);
            return deleteEntry.execute(model, createRevisionId(id));
        });

        if (result.isFail()) {
            throw new TaskNotFoundError();
        }

        const afterDeleteEvent = new TaskAfterDeleteEvent({ task });
        await eventPublisher.publish(afterDeleteEvent);

        return true;
    };

    const createLog = async (task: Pick<TaskService.Task, "id">, data: ITaskLogCreateInput) => {
        const identityContext = container.resolve(IdentityContext);
        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const createEntry = container.resolve(CreateEntryUseCase);
            return createEntry.execute(model, {
                values: {
                    ...data,
                    task: task.id
                }
            });
        });

        if (result.isFail()) {
            throw result.error;
        }

        return convertToLog(result.value as unknown as CmsEntry<ITaskLog>);
    };

    const updateLog = async (id: string, data: ITaskLogUpdateInput) => {
        const identityContext = container.resolve(IdentityContext);
        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const updateEntry = container.resolve(UpdateEntryUseCase);
            return updateEntry.execute(model, createRevisionId(id), {
                values: data
            });
        });

        if (result.isFail()) {
            throw new TaskLogNotFoundError();
        }

        return convertToLog(result.value as unknown as CmsEntry<ITaskLog>);
    };

    const deleteLog = async (id: string) => {
        const identityContext = container.resolve(IdentityContext);
        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const deleteEntry = container.resolve(DeleteEntryUseCase);
            return deleteEntry.execute(model, id);
        });

        if (result.isFail()) {
            throw new TaskLogNotFoundError();
        }

        return true;
    };

    const getLog = async (id: string): Promise<ITaskLog | null> => {
        const identityContext = container.resolve(IdentityContext);
        try {
            const result = await identityContext.withoutAuthorization(async () => {
                const model = await getLogModel();
                const getEntryById = container.resolve(GetEntryByIdUseCase);
                return getEntryById.execute(model, id);
            });

            if (result.isFail()) {
                throw result.error;
            }

            return convertToLog(result.value as unknown as CmsEntry<ITaskLog>);
        } catch (ex) {
            if (ex instanceof NotFoundError) {
                return null;
            }
            throw ex;
        }
    };

    const getLatestLog = async (taskId: string): Promise<ITaskLog> => {
        const identityContext = container.resolve(IdentityContext);
        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const listLatestEntries = container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<ITaskLog>(model, {
                where: {
                    values: {
                        task: taskId
                    }
                },
                sort: ["createdOn_DESC"],
                limit: 1
            });
            if (result.isFail()) {
                throw result.error;
            }
            const { entries } = result.value;
            const [item] = entries;
            if (!item) {
                throw new NotFoundError(`No existing latest log found for task "${taskId}".`);
            }
            return item;
        });

        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const cleanupTaskSubtree = createCleanupTaskSubtree(container);

    const listLogs = async (params: IListTaskLogParams) => {
        const identityContext = container.resolve(IdentityContext);
        const { entries, meta } = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const listLatestEntries = container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<ITaskLog>(model, {
                ...params,
                where: getCmsWhereMapper().map({
                    input: params.where,
                    fields: model.fields
                })
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return {
            items: entries.map(item => convertToLog(item)),
            meta
        };
    };

    return {
        getTask,
        listTasks,
        createTask,
        updateTask,
        deleteTask,
        cleanupTaskSubtree,
        createLog,
        updateLog,
        deleteLog,
        getLog,
        listLogs,
        getLatestLog,
        getTaskModel,
        getLogModel
    };
};
