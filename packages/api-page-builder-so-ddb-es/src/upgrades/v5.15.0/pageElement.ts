import { PbContext } from "@webiny/api-page-builder/graphql/types";
// @ts-ignore
import { PageElementStorageOperationsDdbEs } from "~/operations/pageElement/PageElementStorageOperations";
import { PageElement } from "@webiny/api-page-builder/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import WebinyError from "@webiny/error";

type DbRecord<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export const upgradePageElements = async (context: PbContext) => {
    const tenant: string = context.tenancy.getCurrentTenant().id;
    const localeCodes: string[] = await context.i18n.getLocales().map(locale => locale.code);
    // @ts-ignore
    const pageElementsStorageOperations = context.pageBuilder.pageElements
        .storageOperations as PageElementStorageOperationsDdbEs;
    if (pageElementsStorageOperations instanceof PageElementStorageOperationsDdbEs === false) {
        throw new WebinyError(
            "context.pageBuilder.pageElements.storageOperations must be instance of PageElementStorageOperationsDdbEs."
        );
    }
    /**
     * First we need all categories in all existing locales of the tenant.
     */
    const records: DbRecord<PageElement>[] = [];
    for (const locale of localeCodes) {
        const partitionKey = pageElementsStorageOperations.createPartitionKey({
            tenant,
            locale
        });
        const result = await queryAll<PageElement>({
            entity: pageElementsStorageOperations.entity,
            partitionKey,
            options: {
                gt: " "
            }
        });
        /**
         * Need to update existing menus with tenant and locale information.
         */
        records.push(
            ...result.map(item => {
                return {
                    ...item,
                    PK: partitionKey,
                    SK: pageElementsStorageOperations.createSortKey(item),
                    TYPE: pageElementsStorageOperations.createType(),
                    tenant,
                    locale
                };
            })
        );
    }
    const items = records.map(record => {
        return pageElementsStorageOperations.entity.putBatch(record);
    });

    await batchWriteAll({
        table: pageElementsStorageOperations.table,
        items
    });
};
