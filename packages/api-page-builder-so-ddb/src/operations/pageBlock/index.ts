import WebinyError from "@webiny/error";
import {
    PageBlockStorageOperations,
    PageBlockStorageOperationsCreateParams
} from "@webiny/api-page-builder/types";
import { Entity } from "dynamodb-toolbox";
import { PageBlockDataLoader } from "./dataLoader";
import { PluginsContainer } from "@webiny/plugins";
import { createPartitionKey, createSortKey } from "./keys";

const createType = (): string => {
    return "pb.pageBlock";
};

export interface CreatePageBlockStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createPageBlockStorageOperations = ({
    entity
}: CreatePageBlockStorageOperationsParams): PageBlockStorageOperations => {
    const dataLoader = new PageBlockDataLoader({
        entity
    });

    const create = async (params: PageBlockStorageOperationsCreateParams) => {
        const { pageBlock } = params;

        const keys = {
            PK: createPartitionKey({
                tenant: pageBlock.tenant,
                locale: pageBlock.locale
            }),
            SK: createSortKey(pageBlock)
        };

        try {
            await entity.put({
                ...pageBlock,
                TYPE: createType(),
                ...keys
            });
            /**
             * Always clear data loader cache when modifying the records.
             */
            dataLoader.clear();

            return pageBlock;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create page block.",
                ex.code || "PAGE_BLOCK_CREATE_ERROR",
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
