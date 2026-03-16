import WebinyError from "@webiny/error";
import type {
    Context,
    IListTaskLogParams,
    IListTaskParams,
    ITaskCreateData,
    ITaskLog,
    ITaskLogCreateInput,
    ITaskLogUpdateInput,
    ITasksContextCrudObject,
    ITaskUpdateData
} from "~/types.js";
import { TaskDataStatus } from "~/types.js";
import { WEBINY_TASK_MODEL_ID } from "./TaskPrivateModel.js";
import { WEBINY_TASK_LOG_MODEL_ID } from "./TaskLogPrivateModel.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { createZodError, parseIdentifier } from "@webiny/utils";
import zod from "zod";
import type { GenericRecord } from "@webiny/api/types.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import {
    TaskDefinitionNotFoundError,
    TaskLogNotFoundError,
    TaskNotFoundError
} from "~/domain/errors.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import {
    TaskAfterCreateEvent,
    TaskAfterDeleteEvent,
    TaskAfterUpdateEvent,
    TaskBeforeCreateEvent,
    TaskBeforeDeleteEvent,
    TaskBeforeUpdateEvent
} from "~/events/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";

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
    definition: Pick<TaskDefinition.Interface, "createInputValidation">;
    data: Pick<ITaskCreateData, "input">;
    context: Context;
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

export const createTaskCrud = (context: Context): ITasksContextCrudObject => {
    const cmsWhereMapper = context.container.resolve(CmsWhereMapper);

    const getTaskModel = async (): Promise<CmsModel> => {
        const identityContext = context.container.resolve(IdentityContext);
        return await identityContext.withoutAuthorization(async () => {
            const getModel = context.container.resolve(GetModelUseCase);
            const result = await getModel.execute(WEBINY_TASK_MODEL_ID);
            if (result.isFail()) {
                throw new WebinyError(`There is no model "${WEBINY_TASK_MODEL_ID}".`);
            }
            return result.value;
        });
    };

    const getLogModel = async (): Promise<CmsModel> => {
        const identityContext = context.container.resolve(IdentityContext);
        return await identityContext.withoutAuthorization(async () => {
            const getModel = context.container.resolve(GetModelUseCase);
            const result = await getModel.execute(WEBINY_TASK_LOG_MODEL_ID);
            if (result.isFail()) {
                throw new WebinyError(`There is no model "${WEBINY_TASK_LOG_MODEL_ID}".`);
            }
            return result.value;
        });
    };

    const getTask = async <
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string
    ) => {
        const identityContext = context.container.resolve(IdentityContext);

        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const getEntryById = context.container.resolve(GetEntryByIdUseCase);
            const result = await getEntryById.execute(model, createRevisionId(id));
            if (result.isFail()) {
                return null;
            }
            return result.value;
        });

        if (!entry) {
            return null;
        }

        return convertToTask(entry as unknown as CmsEntry<TaskService.Task<T, O>>);
    };

    const listTasks = async <
        T extends TaskService.TaskInput = TaskService.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params?: IListTaskParams
    ) => {
        const identityContext = context.container.resolve(IdentityContext);
        const { entries, meta } = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<TaskService.Task<T, O>>(model, {
                ...params,
                where: cmsWhereMapper.map({
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
        const definition = context.tasks.getDefinition(data.definitionId);
        if (!definition) {
            throw new TaskDefinitionNotFoundError(data.definitionId);
        }

        await validateTaskInput({
            context,
            definition,
            data
        });

        const identityContext = context.container.resolve(IdentityContext);
        const eventPublisher = context.container.resolve(EventPublisher);

        const beforeCreateEvent = new TaskBeforeCreateEvent({
            input: data
        });
        await eventPublisher.publish(beforeCreateEvent);

        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const createEntry = context.container.resolve(CreateEntryUseCase);
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

        const identityContext = context.container.resolve(IdentityContext);
        const eventPublisher = context.container.resolve(EventPublisher);

        const beforeUpdateEvent = new TaskBeforeUpdateEvent({
            input: data,
            original
        });
        await eventPublisher.publish(beforeUpdateEvent);

        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const updateEntry = context.container.resolve(UpdateEntryUseCase);
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

        const identityContext = context.container.resolve(IdentityContext);
        const eventPublisher = context.container.resolve(EventPublisher);

        const beforeDeleteEvent = new TaskBeforeDeleteEvent({
            task
        });
        await eventPublisher.publish(beforeDeleteEvent);

        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const deleteEntry = context.container.resolve(DeleteEntryUseCase);
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
        const identityContext = context.container.resolve(IdentityContext);
        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const createEntry = context.container.resolve(CreateEntryUseCase);
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
        const identityContext = context.container.resolve(IdentityContext);
        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const updateEntry = context.container.resolve(UpdateEntryUseCase);
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
        const identityContext = context.container.resolve(IdentityContext);
        const result = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const deleteEntry = context.container.resolve(DeleteEntryUseCase);
            return deleteEntry.execute(model, id);
        });

        if (result.isFail()) {
            throw new TaskLogNotFoundError();
        }

        return true;
    };

    const getLog = async (id: string): Promise<ITaskLog | null> => {
        const identityContext = context.container.resolve(IdentityContext);
        try {
            const result = await identityContext.withoutAuthorization(async () => {
                const model = await getLogModel();
                const getEntryById = context.container.resolve(GetEntryByIdUseCase);
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
        const identityContext = context.container.resolve(IdentityContext);
        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);
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

    const listLogs = async (params: IListTaskLogParams) => {
        const identityContext = context.container.resolve(IdentityContext);
        const { entries, meta } = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<ITaskLog>(model, {
                ...params,
                where: cmsWhereMapper.map({
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
