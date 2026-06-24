import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ListFoldersUseCase } from "@webiny/api-aco/features/folder/ListFolders/index.js";
import { DeleteFolderUseCase } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import {
    CmsContext,
    StorageOperations
} from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { DeleteModelUseCase } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DbInstance } from "@webiny/handler-db/abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IDeleteModelTaskInput } from "./types.js";
import type { IDeleteModelTaskOutput } from "./types.js";
import { createStoreKey } from "~/helpers/store.js";

type IRunParams = TaskDefinition.RunParams<IDeleteModelTaskInput, IDeleteModelTaskOutput>;

export interface IDeleteModel {
    run(
        params: IRunParams
    ): Promise<TaskDefinition.Result<IDeleteModelTaskInput, IDeleteModelTaskOutput>>;
}

export class DeleteModel implements IDeleteModel {
    constructor(private context: CmsContext.Interface) {}

    public async run(
        params: IRunParams
    ): Promise<TaskDefinition.Result<IDeleteModelTaskInput, IDeleteModelTaskOutput>> {
        const { input, controller } = params;

        const model = await this.getModel(input.modelId);

        let hasMoreItems = false;
        let lastDeletedId: string | undefined = input.lastDeletedId;
        do {
            if (controller.runtime.isAborted()) {
                /**
                 * If the task was aborted, we need to remove the task tag from the model.
                 */
                await this.removeBeingDeleted(model);
                return controller.response.aborted();
            } else if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue({
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
            const storageOps = this.context.container.resolve(StorageOperations);
            const { items, hasMoreItems: metaHasMoreItems } = await storageOps.entries.list(model, {
                limit: 1000,
                where,
                sort: ["entryId_ASC"]
            });
            for (const item of items) {
                try {
                    const deleteResult = await this.context.container
                        .resolve(DeleteEntryUseCase)
                        .execute(model, item.id, {
                            permanently: true,
                            force: true
                        });
                    if (deleteResult.isFail()) {
                        throw deleteResult.error;
                    }
                } catch {
                    console.error("Failed to delete entry.", {
                        model: model.modelId,
                        id: item.id
                    });
                    return controller.response.error(
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
        const storageOps = this.context.container.resolve(StorageOperations);
        const { items } = await storageOps.entries.list(model, {
            limit: 1,
            where: {
                latest: true
            }
        });
        if (items.length > 0) {
            console.log("There are still items to be deleted. Continuing the task.");
            return controller.response.continue(
                {
                    ...input
                },
                {
                    seconds: 5
                }
            );
        }

        let hasMoreFolders = false;

        const listFolders = this.context.container.resolve(ListFoldersUseCase);
        const deleteFolder = this.context.container.resolve(DeleteFolderUseCase);

        do {
            const listResult = await listFolders.execute({
                where: {
                    type: `cms:${model.modelId}`
                },
                limit: 1000
            });

            const { folders, meta } = listResult.value;

            for (const item of folders) {
                const result = await deleteFolder.execute(item.id);
                if (result.isFail()) {
                    return controller.response.error(result.error);
                }
            }

            hasMoreFolders = meta.hasMoreItems;
        } while (hasMoreFolders);

        /**
         * When there is no more records to be deleted, let's delete the model, if it's not a plugin.
         */
        await this.removeBeingDeleted(model);
        if (model.isPlugin) {
            return controller.response.done();
        }
        try {
            const deleteModelResult = await this.context.container
                .resolve(DeleteModelUseCase)
                .execute(model.modelId);
            if (deleteModelResult.isFail()) {
                throw deleteModelResult.error;
            }
        } catch (ex) {
            const message = `Failed to delete model "${model.modelId}".`;
            console.error(message);
            return controller.response.error(ex);
        }

        return controller.response.done();
    }

    private async getModel(modelId: string): Promise<CmsModel> {
        const result = await this.context.container.resolve(GetModelUseCase).execute(modelId);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }

    private async removeBeingDeleted(model: Pick<CmsModel, "modelId" | "tenant">): Promise<void> {
        const key = createStoreKey(model);
        await this.context.container.resolve(DbInstance).store.removeValue(key);
    }
}
