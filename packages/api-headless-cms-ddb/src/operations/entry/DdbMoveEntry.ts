import WebinyError from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createPartitionKey } from "~/operations/entry/keys.js";

class DdbMoveEntryImpl implements MoveEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute(initialModel: CmsModel, id: string, folderId: string) {
        /**
         * We need to:
         * - load all the revisions of the entry, including published and latest
         * - update all the revisions (published and latest ) of the entry with new folderId
         */
        const model = this.storageModelProvider.getModel(initialModel);
        /**
         * First we need to load all the revisions and published / latest entry.
         */
        const partitionKey = createPartitionKey({
            id,
            tenant: model.tenant
        });
        const records = await this.entity.queryAll({
            partitionKey,
            options: {
                gte: " "
            }
        });
        /**
         * Then create the batch writes for the DynamoDB, with the updated folderId.
         */
        const entityBatch = this.entity.createEntityWriter({
            put: records.map(item => {
                return {
                    ...item,
                    data: {
                        ...item.data,
                        location: {
                            ...item.data.location,
                            folderId
                        }
                    }
                };
            })
        });

        /**
         * And finally write it...
         */
        try {
            await entityBatch.execute();
        } catch (ex) {
            throw WebinyError.from(ex, {
                message: "Could not move records to a new folder.",
                data: {
                    id,
                    folderId
                }
            });
        }
    }
}

export const DdbMoveEntry = MoveEntryStorageOperation.createImplementation({
    implementation: DdbMoveEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsStorageModelProvider]
});
