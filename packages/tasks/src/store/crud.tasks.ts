import WebinyError from "@webiny/error";
import { Context, IListTaskParams, ITaskData, ITasksContextObject } from "~/types";
import { WEBINY_TASK_MODEL_ID } from "./model";
import { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types";

export class TaskCrud implements ITasksContextObject {
    private readonly context: Context;

    public constructor(context: Context) {
        this.context = context;
    }

    public async getTask(id: string) {
        const entry = await this.context.security.withoutAuthorization(async () => {
            const model = await this.getModel();
            return await this.context.cms.getEntryById(model, id);
        });
        if (!entry) {
            return null;
        }

        return this.convertToTask(entry as unknown as CmsEntry<ITaskData>);
    }

    public async listTasks(params?: IListTaskParams) {
        const [items, meta] = await this.context.security.withoutAuthorization(async () => {
            const model = await this.getModel();
            return await this.context.cms.listEntries<ITaskData>(model, params || {});
        });

        return {
            items: items.map(this.convertToTask),
            meta
        };
    }
    public async createTask(task: ITaskData) {
        const data = this.convertToEntry(task);
        const entry = await this.context.security.withoutAuthorization(async () => {
            const model = await this.getModel();
            return await this.context.cms.createEntry(model, data);
        });
        return this.convertToTask(entry as unknown as CmsEntry<ITaskData>);
    }
    async updateTask(id: string, task: Partial<ITaskData>) {
        const data = this.convertToEntry(task as ITaskData);
        const entry = await this.context.security.withoutAuthorization(async () => {
            const model = await this.getModel();
            return await this.context.cms.updateEntry(model, id, {
                ...data,
                savedOn: data.savedOn || new Date().toISOString()
            });
        });
        return this.convertToTask(entry as unknown as CmsEntry<ITaskData>);
    }
    async deleteTask(id: string) {
        return this.context.security.withoutAuthorization(async () => {
            const model = await this.getModel();
            await this.context.cms.deleteEntry(model, id);
            return true;
        });
    }

    public async getModel(): Promise<CmsModel> {
        const model = await this.context.cms.getModel(WEBINY_TASK_MODEL_ID);
        if (model) {
            return model;
        }
        throw new WebinyError(`There is no model "${WEBINY_TASK_MODEL_ID}".`);
    }

    private convertToTask(entry: CmsEntry<ITaskData>): ITaskData {
        return {
            id: entry.entryId,
            createdOn: this.getDate<Date>(entry.createdOn),
            savedOn: this.getDate<Date>(entry.savedOn),
            name: entry.values.name,
            input: entry.values.input,
            status: entry.values.status,
            startedOn: this.getDate(entry.values.startedOn),
            finishedOn: this.getDate(entry.values.finishedOn),
            log: entry.values.log
        };
    }

    private convertToEntry(task: ITaskData): CmsEntryValues {
        return {
            name: task.name,
            input: task.input,
            status: task.status,
            startedOn: this.getDateString(task.startedOn),
            finishedOn: this.getDateString(task.finishedOn),
            log: task.log
        };
    }

    private getDate<T extends Date | string | null | undefined>(date?: Date | string | null): T {
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
    }

    private getDateString(date?: Date | string | null): string | null {
        if (!date) {
            return null;
        }
        if (date instanceof Date) {
            return date.toISOString();
        }
        return date;
    }
}
