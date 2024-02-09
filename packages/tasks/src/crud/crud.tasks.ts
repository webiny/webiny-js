import WebinyError from "@webiny/error";
import {
    Context,
    IListTaskLogParams,
    IListTaskParams,
    ITask,
    ITaskCreateData,
    ITaskDataInput,
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
    OnTaskBeforeUpdateTopicParams,
    TaskDataStatus
} from "~/types";
import { WEBINY_TASK_LOG_MODEL_ID, WEBINY_TASK_MODEL_ID } from "./model";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import { remapWhere } from "./where";
import { parseIdentifier } from "@webiny/utils";

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

export const createTaskCrud = (context: Context): ITasksContextCrudObject => {
    const onTaskBeforeCreate = createTopic<OnTaskBeforeCreateTopicParams>("tasks.onBeforeCreate");
    const onTaskAfterCreate = createTopic<OnTaskAfterCreateTopicParams>("tasks.onAfterCreate");
    const onTaskBeforeUpdate = createTopic<OnTaskBeforeUpdateTopicParams>("tasks.onBeforeUpdate");
    const onTaskAfterUpdate = createTopic<OnTaskAfterUpdateTopicParams>("tasks.onAfterUpdate");
    const onTaskBeforeDelete = createTopic<OnTaskBeforeDeleteTopicParams>("tasks.onBeforeDelete");
    const onTaskAfterDelete = createTopic<OnTaskAfterDeleteTopicParams>("tasks.onAfterDelete");

    const getTaskModel = async (): Promise<CmsModel> => {
        return await context.security.withoutAuthorization(async () => {
            const model = await context.cms.getModel(WEBINY_TASK_MODEL_ID);
            if (model) {
                return model;
            }
            throw new WebinyError(`There is no model "${WEBINY_TASK_MODEL_ID}".`);
        });
    };

    const getLogModel = async (): Promise<CmsModel> => {
        return await context.security.withoutAuthorization(async () => {
            const model = await context.cms.getModel(WEBINY_TASK_LOG_MODEL_ID);
            if (model) {
                return model;
            }
            throw new WebinyError(`There is no model "${WEBINY_TASK_LOG_MODEL_ID}".`);
        });
    };

    const getTask = async <
        T = any,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(
        id: string
    ) => {
        let entry: CmsEntry;
        try {
            entry = await context.security.withoutAuthorization(async () => {
                const model = await getTaskModel();
                return await context.cms.getEntryById(model, createRevisionId(id));
            });
        } catch (ex) {
            if (ex instanceof NotFoundError) {
                return null;
            }
            throw ex;
        }
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
        const [items, meta] = await context.security.withoutAuthorization(async () => {
            const model = await getTaskModel();
            return await context.cms.listLatestEntries<ITask<T, O>>(model, {
                ...params,
                where: remapWhere(params?.where)
            });
        });

        return {
            items: items.map(item => convertToTask<T, O>(item)),
            meta
        };
    };

    const createTask = async (data: ITaskCreateData) => {
        const definition = context.tasks.getDefinition(data.definitionId);
        if (!definition) {
            throw new WebinyError(`There is no task definition.`, "TASK_DEFINITION_ERROR", {
                id: data.definitionId
            });
        }

        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getTaskModel();
            return await context.cms.createEntry(model, {
                ...data,
                iterations: 0,
                taskStatus: TaskDataStatus.PENDING
            });
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
        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getTaskModel();
            return await context.cms.updateEntry(model, createRevisionId(id), {
                ...data,
                savedOn: new Date().toISOString()
            });
        });
        return convertToTask<T, O>(entry as unknown as CmsEntry<ITask<T, O>>);
    };

    const deleteTask = (id: string) => {
        return context.security.withoutAuthorization(async () => {
            const model = await getTaskModel();
            await context.cms.deleteEntry(model, createRevisionId(id));
            return true;
        });
    };

    const createLog = async (task: Pick<ITask, "id">, data: ITaskLogCreateInput) => {
        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getLogModel();

            return await context.cms.createEntry(model, {
                ...data,
                task: task.id
            });
        });
        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const updateLog = async (id: string, data: ITaskLogUpdateInput) => {
        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getLogModel();

            return await context.cms.updateEntry(model, createRevisionId(id), data);
        });
        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const getLog = async (id: string): Promise<ITaskLog | null> => {
        try {
            const entry = await context.security.withoutAuthorization(async () => {
                const model = await getLogModel();
                return await context.cms.getEntryById(model, id);
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
        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getLogModel();
            const [items] = await context.cms.listLatestEntries<ITaskLog>(model, {
                where: {
                    task: taskId
                },
                sort: ["createdOn_DESC"],
                limit: 1
            });
            const [item] = items;
            if (!item) {
                throw new NotFoundError(`No existing latest log found for task "${taskId}".`);
            }
            return item;
        });

        return convertToLog(entry as unknown as CmsEntry<ITaskLog>);
    };

    const listLogs = async (params: IListTaskLogParams) => {
        const [items, meta] = await context.security.withoutAuthorization(async () => {
            const model = await getLogModel();
            return await context.cms.listLatestEntries<ITaskLog>(model, {
                ...params,
                where: remapWhere(params.where)
            });
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
        getLog,
        listLogs,
        getLatestLog,
        getTaskModel,
        getLogModel
    };
};
