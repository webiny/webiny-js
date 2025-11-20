import WebinyError from "@webiny/error";
import type {
    Context,
    IListTaskLogParams,
    IListTaskParams,
    ITask,
    ITaskCreateData,
    ITaskDataInput,
    ITaskDefinition,
    ITaskLog,
    ITaskLogCreateInput,
    ITaskLogUpdateInput,
    ITaskResponseDoneResultOutput,
    ITasksContextCrudObject,
    ITaskUpdateData,
    OnTaskAfterCreateTopicParams,
    OnTaskAfterDeleteTopicParams,
    OnTaskAfterUpdateTopicParams,
    OnTaskBeforeCreateTopicParams,
    OnTaskBeforeDeleteTopicParams,
    OnTaskBeforeUpdateTopicParams
} from "~/types.js";
import { TaskDataStatus } from "~/types.js";
import { WEBINY_TASK_LOG_MODEL_ID, WEBINY_TASK_MODEL_ID } from "./model.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import { remapWhere } from "./where.js";
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

const createRevisionId = (id: string) => {
    const { id: entryId } = parseIdentifier(id);
    return `${entryId}#0001`;
};

const convertToTask = <
    T = any,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
>(
    entry: CmsEntry<ITask<T, O>>
): ITask<T, O> => {
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
    definition: Pick<ITaskDefinition, "createInputValidation">;
    data: Pick<ITaskCreateData, "input">;
    context: Context;
}

const getZodSchema = (schema: GenericRecord<string, zod.Schema> | zod.Schema) => {
    if (!schema) {
        return zod.object({}).passthrough();
    } else if (schema instanceof zod.ZodObject) {
        return schema.passthrough();
    } else if (schema instanceof zod.Schema) {
        return schema;
    }
    return zod.object(schema).passthrough();
};

const validateTaskInput = async (params: IValidateParams) => {
    const { definition, data, context } = params;
    if (!definition.createInputValidation) {
        return;
    }
    const schema = definition.createInputValidation({
        context,
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
    const onTaskBeforeCreate = createTopic<OnTaskBeforeCreateTopicParams>("tasks.onBeforeCreate");
    const onTaskAfterCreate = createTopic<OnTaskAfterCreateTopicParams>("tasks.onAfterCreate");
    const onTaskBeforeUpdate = createTopic<OnTaskBeforeUpdateTopicParams>("tasks.onBeforeUpdate");
    const onTaskAfterUpdate = createTopic<OnTaskAfterUpdateTopicParams>("tasks.onAfterUpdate");
    const onTaskBeforeDelete = createTopic<OnTaskBeforeDeleteTopicParams>("tasks.onBeforeDelete");
    const onTaskAfterDelete = createTopic<OnTaskAfterDeleteTopicParams>("tasks.onAfterDelete");

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
        T = any,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
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

        return convertToTask(entry as unknown as CmsEntry<ITask<T, O>>);
    };

    const listTasks = async <
        T = any,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        params?: IListTaskParams
    ) => {
        const identityContext = context.container.resolve(IdentityContext);
        const [items, meta] = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<ITask<T, O>>(model, {
                ...params,
                where: remapWhere(params?.where)
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return {
            items: items.map(item => convertToTask<T, O>(item)),
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
        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const result = await createEntry.execute(model, {
                ...data,
                iterations: 0,
                taskStatus: TaskDataStatus.PENDING
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return convertToTask(entry as unknown as CmsEntry<ITask>);
    };

    const updateTask = async <
        T = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        id: string,
        data: ITaskUpdateData<T, O>
    ) => {
        const identityContext = context.container.resolve(IdentityContext);
        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const updateEntry = context.container.resolve(UpdateEntryUseCase);
            const result = await updateEntry.execute(model, createRevisionId(id), {
                ...data,
                savedOn: new Date().toISOString()
            });

            if (result.isFail()) {
                return null;
            }

            return result.value;
        });

        if (!entry) {
            throw new TaskNotFoundError();
        }

        return convertToTask<T, O>(entry as unknown as CmsEntry<ITask<T, O>>);
    };

    const deleteTask = async (id: string) => {
        const identityContext = context.container.resolve(IdentityContext);
        return identityContext.withoutAuthorization(async () => {
            const model = await getTaskModel();
            const deleteEntry = context.container.resolve(DeleteEntryUseCase);
            const result = await deleteEntry.execute(model, createRevisionId(id));
            if (result.isFail()) {
                throw new TaskNotFoundError();
            }
            return true;
        });
    };

    const createLog = async (task: Pick<ITask, "id">, data: ITaskLogCreateInput) => {
        const identityContext = context.container.resolve(IdentityContext);
        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const result = await createEntry.execute(model, {
                ...data,
                task: task.id
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const updateLog = async (id: string, data: ITaskLogUpdateInput) => {
        const identityContext = context.container.resolve(IdentityContext);
        const entry = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const updateEntry = context.container.resolve(UpdateEntryUseCase);
            const result = await updateEntry.execute(model, createRevisionId(id), data);
            if (result.isFail()) {
                throw new TaskLogNotFoundError();
            }
            return result.value;
        });
        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const deleteLog = async (id: string) => {
        const identityContext = context.container.resolve(IdentityContext);
        return identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const deleteEntry = context.container.resolve(DeleteEntryUseCase);
            const result = await deleteEntry.execute(model, id);
            if (result.isFail()) {
                throw new TaskLogNotFoundError();
            }
            return true;
        });
    };

    const getLog = async (id: string): Promise<ITaskLog | null> => {
        const identityContext = context.container.resolve(IdentityContext);
        try {
            const entry = await identityContext.withoutAuthorization(async () => {
                const model = await getLogModel();
                const getEntryById = context.container.resolve(GetEntryByIdUseCase);
                const result = await getEntryById.execute(model, id);
                if (result.isFail()) {
                    throw result.error;
                }
                return result.value;
            });

            return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
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
                    task: taskId
                },
                sort: ["createdOn_DESC"],
                limit: 1
            });
            if (result.isFail()) {
                throw result.error;
            }
            const [items] = result.value;
            const [item] = items;
            if (!item) {
                throw new NotFoundError(`No existing latest log found for task "${taskId}".`);
            }
            return item;
        });

        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const listLogs = async (params: IListTaskLogParams) => {
        const identityContext = context.container.resolve(IdentityContext);
        const [items, meta] = await identityContext.withoutAuthorization(async () => {
            const model = await getLogModel();
            const listLatestEntries = context.container.resolve(ListLatestEntriesUseCase);
            const result = await listLatestEntries.execute<ITaskLog>(model, {
                ...params,
                where: remapWhere(params.where)
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return {
            items: items.map(item => convertToLog(item)),
            meta
        };
    };

    return {
        onTaskBeforeCreate,
        onTaskAfterCreate,
        onTaskBeforeUpdate,
        onTaskAfterUpdate,
        onTaskBeforeDelete,
        onTaskAfterDelete,
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
