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

const getDate = <T extends Date | string | null | undefined>(date?: Date | string | null): T => {
    if (!date) {
        return undefined as T;
    } else if (date instanceof Date) {
        return date as T;
    }
    try {
        return new Date(date) as T;
    } catch {
        return undefined as T;
    }
};

const convertToTask = (entry: CmsEntry<ITaskData>): ITaskData => {
    return {
        id: entry.id,
        createdOn: getDate<Date>(entry.createdOn),
        savedOn: getDate<Date>(entry.savedOn),
        createdBy: entry.createdBy,
        name: entry.values.name,
        definitionId: entry.values.definitionId,
        values: entry.values.values,
        status: entry.values.status,
        startedOn: getDate(entry.values.startedOn),
        finishedOn: getDate(entry.values.finishedOn),
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
                status: TaskDataStatus.PENDING
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
        const model = await context.cms.getModel(WEBINY_TASK_MODEL_ID);
        if (model) {
            return model;
        }
        throw new WebinyError(`There is no model "${WEBINY_TASK_MODEL_ID}".`);
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
