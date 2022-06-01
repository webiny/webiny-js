import WebinyError from "@webiny/error";
import {
    BlockStorageOperations,
    BlockStorageOperationsCreateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "dynamodb-toolbox";
import { BlockDataLoader } from "./dataLoader";
import { PluginsContainer } from "@webiny/plugins";
import { createPartitionKey, createSortKey } from "./keys";

const createType = (): string => {
    return "pb.block";
};

export interface CreateBlockStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createBlockStorageOperations = ({
    entity
}: CreateBlockStorageOperationsParams): BlockStorageOperations => {
    const dataLoader = new BlockDataLoader({
        entity
    });

    const create = async (params: BlockStorageOperationsCreateParams) => {
        const { block } = params;

        const keys = {
            PK: createPartitionKey({
                tenant: block.tenant,
                locale: block.locale
            }),
            SK: createSortKey(block)
        };

        try {
            await entity.put({
                ...block,
                TYPE: createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return block;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create block.",
                ex.code || "BLOCK_CREATE_ERROR",
                {
                    keys
                }
            );
        }
    };

    return {
        create
    };
};
