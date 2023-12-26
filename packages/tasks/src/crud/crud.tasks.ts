import WebinyError from "@webiny/error";
import {
    Context,
    IListTaskParams,
    ITaskCreateData,
    ITaskData,
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
import { WEBINY_TASK_MODEL_ID } from "./model";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";

const convertToTask = (entry: CmsEntry<ITaskData>): ITaskData => {
    return {
        id: entry.id,
        createdOn: entry.createdOn,
        savedOn: entry.savedOn,
        createdBy: entry.createdBy,
        name: entry.values.name,
        definitionId: entry.values.definitionId,
        values: entry.values.values,
        taskStatus: entry.values.taskStatus,
        eventResponse: entry.values.eventResponse,
        startedOn: entry.values.startedOn,
        finishedOn: entry.values.finishedOn,
        log: entry.values.log
    };
};

export const createTaskCrud = (context: Context): ITasksContextCrudObject => {
    const onTaskBeforeCreate = createTopic<OnTaskBeforeCreateTopicParams>("tasks.onBeforeCreate");
    const onTaskAfterCreate = createTopic<OnTaskAfterCreateTopicParams>("tasks.onAfterCreate");
    const onTaskBeforeUpdate = createTopic<OnTaskBeforeUpdateTopicParams>("tasks.onBeforeUpdate");
    const onTaskAfterUpdate = createTopic<OnTaskAfterUpdateTopicParams>("tasks.onAfterUpdate");
    const onTaskBeforeDelete = createTopic<OnTaskBeforeDeleteTopicParams>("tasks.onBeforeDelete");
    const onTaskAfterDelete = createTopic<OnTaskAfterDeleteTopicParams>("tasks.onAfterDelete");

    const getTask = async (id: string) => {
        let entry: CmsEntry;
        try {
            entry = await context.security.withoutAuthorization(async () => {
                const model = await getModel();
                return await context.cms.getEntryById(model, id);
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

        return convertToTask(entry as unknown as CmsEntry<ITaskData>);
    };

    const listTasks = async (params?: IListTaskParams) => {
        const [items, meta] = await context.security.withoutAuthorization(async () => {
            const model = await getModel();
            return await context.cms.listLatestEntries<ITaskData>(model, params || {});
        });

        return {
            items: items.map(item => convertToTask(item)),
            meta
        };
    };

    const createTask = async (values: ITaskCreateData<any>) => {
        const definition = context.tasks.getDefinition(values.definitionId);
        if (!definition) {
            throw new WebinyError(`There is no task definition.`, "TASK_DEFINITION_ERROR", {
                id: values.definitionId
            });
        }

        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getModel();
            return await context.cms.createEntry(model, {
                ...values,
                log: [],
                taskStatus: TaskDataStatus.PENDING
            });
        });
        return convertToTask(entry as unknown as CmsEntry<ITaskData>);
    };

    const updateTask = async (id: string, values: ITaskUpdateData) => {
        const entry = await context.security.withoutAuthorization(async () => {
            const model = await getModel();
            return await context.cms.updateEntry(model, id, {
                ...values,
                savedOn: new Date().toISOString()
            });
        });
        return convertToTask(entry as unknown as CmsEntry<ITaskData>);
    };

    const deleteTask = (id: string) => {
        return context.security.withoutAuthorization(async () => {
            const model = await getModel();
            await context.cms.deleteEntry(model, id);
            return true;
        });
    };

    const getModel = async (): Promise<CmsModel> => {
        return await context.security.withoutAuthorization(async () => {
            const model = await context.cms.getModel(WEBINY_TASK_MODEL_ID);
            if (model) {
                return model;
            }
            throw new WebinyError(`There is no model "${WEBINY_TASK_MODEL_ID}".`);
        });
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
        getModel
    };
};
