import type { ITaskResponse, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import type { HcmsTasksContext } from "~/types";
import type { IDeleteModelTaskInput, IDeleteModelTaskOutput } from "./types";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types";
import { createStoreKey } from "~/tasks/deleteModel/helpers/store";

export interface IDeleteModelRunnerParams<
    C extends HcmsTasksContext,
    I extends IDeleteModelTaskInput,
    O extends IDeleteModelTaskOutput
> {
    taskId: string;
    context: C;
    response: ITaskResponse<I, O>;
}

export type IExecuteParams<
    C extends HcmsTasksContext,
    I extends IDeleteModelTaskInput,
    O extends IDeleteModelTaskOutput
> = Omit<ITaskRunParams<C, I, O>, "context" | "response" | "store" | "timer" | "trigger">;

export class DeleteModelRunner<
    C extends HcmsTasksContext,
    I extends IDeleteModelTaskInput,
    O extends IDeleteModelTaskOutput
> {
    private readonly taskId: string;
    private readonly context: C;
    private readonly response: ITaskResponse<I, O>;

    public constructor(params: IDeleteModelRunnerParams<C, I, O>) {
        this.taskId = params.taskId;
        this.context = params.context;
        this.response = params.response;
    }

    public async execute(params: IExecuteParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { input, isCloseToTimeout, isAborted } = params;

        const model = await this.getModel(input.modelId);

        let hasMoreItems = false;
        let lastDeletedId: string | undefined = input.lastDeletedId;
        do {
            if (isAborted()) {
                /**
                 * If the task was aborted, we need to remove the task tag from the model.
                 */
                await this.removeBeingDeleted(model);
                return this.response.aborted();
            } else if (isCloseToTimeout()) {
                return this.response.continue({
                    ...input,
                    lastDeletedId
                });
            }
            const where: CmsEntryListWhere = {
                latest: true
            };
            if (lastDeletedId) {
                where.entryId_gte = lastDeletedId;
            }
            const { items, hasMoreItems: metaHasMoreItems } =
                await this.context.cms.storageOperations.entries.list(model, {
                    limit: 1000,
                    where,
                    sort: ["entryId_ASC"]
                });
            for (const item of items) {
                try {
                    await this.context.cms.deleteEntry(model, item.id, {
                        permanently: true,
                        force: true
                    });
                } catch {
                    console.error("Failed to delete entry.", {
                        model: model.modelId,
                        id: item.id
                    });
                    return this.response.error(
                        new Error(`Failed to delete entry "${item.id}". Cannot continue.`)
                    );
                }
                lastDeletedId = item.entryId;
            }

            hasMoreItems = metaHasMoreItems;
        } while (hasMoreItems);
        /**
         * Let's do one more check. If there are items, continue the task with 5 seconds delay.
         */
        const { items } = await this.context.cms.storageOperations.entries.list(model, {
            limit: 1,
            where: {
                latest: true
            }
        });
        if (items.length > 0) {
            console.log("There are still items to be deleted. Continuing the task.");
            return this.response.continue(
                {
                    ...input
                },
                {
                    seconds: 5
                }
            );
        }

        let hasMoreFolders = false;
        do {
            const [items, meta] = await this.context.aco.folder.list({
                where: {
                    type: `cms:${model.modelId}`
                },
                limit: 1000
            });
            for (const item of items) {
                try {
                    await this.context.aco.folder.delete(item.id);
                } catch (ex) {
                    console.error(`Failed to delete folder "${item.id}".`, ex);
                    return this.response.error(ex);
                }
            }

            hasMoreFolders = meta.hasMoreItems;
        } while (hasMoreFolders);

        /**
         * When there is no more records to be deleted, let's delete the model, if it's not a plugin.
         */
        await this.removeBeingDeleted(model);
        if (model.isPlugin) {
            return this.response.done();
        }
        try {
            await this.context.cms.deleteModel(model.modelId);
        } catch (ex) {
            const message = `Failed to delete model "${model.modelId}".`;
            console.error(message);
            return this.response.error(ex);
        }

        return this.response.done();
    }

    private async getModel(modelId: string): Promise<CmsModel> {
        const model = await this.context.cms.getModel(modelId);
        if (!model) {
            throw new Error(`Model "${modelId}" not found.`);
        }
        return model;
    }

    private async removeBeingDeleted(
        model: Pick<CmsModel, "modelId" | "tenant" | "locale">
    ): Promise<void> {
        const key = createStoreKey(model);
        await this.context.db.store.removeValue(key);
    }
}

export const createDeleteModelRunner = <
    C extends HcmsTasksContext,
    I extends IDeleteModelTaskInput,
    O extends IDeleteModelTaskOutput
>(
    params: IDeleteModelRunnerParams<C, I, O>
) => {
    return new DeleteModelRunner<C, I, O>(params);
};
