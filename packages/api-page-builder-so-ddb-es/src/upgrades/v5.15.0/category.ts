import { PbContext } from "@webiny/api-page-builder/graphql/types";
// @ts-ignore
import { CategoryStorageOperationsDdbEs } from "~/operations/category/CategoryStorageOperations";
import { Category } from "@webiny/api-page-builder/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import WebinyError from "@webiny/error";

type DbRecord<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export const upgradeCategories = async (context: PbContext) => {
    const tenant: string = context.tenancy.getCurrentTenant().id;
    const localeCodes: string[] = await context.i18n.getLocales().map(locale => locale.code);
    // @ts-ignore
    const categoryStorageOperations = context.pageBuilder.categories
        .storageOperations as CategoryStorageOperationsDdbEs;
    if (categoryStorageOperations instanceof CategoryStorageOperationsDdbEs === false) {
        throw new WebinyError(
            "context.pageBuilder.categories.storageOperations must be instance of CategoryStorageOperationsDdbEs."
        );
    }
    /**
     * First we need all categories in all existing locales of the tenant.
     */
    const records: DbRecord<Category>[] = [];
    for (const locale of localeCodes) {
        const partitionKey = categoryStorageOperations.createPartitionKey({
            tenant,
            locale
        });
        const result = await queryAll<Category>({
            entity: categoryStorageOperations.entity,
            partitionKey,
            options: {
                gt: " "
            }
        });
        /**
         * Need to update existing categories with tenant and locale information.
         */
        records.push(
            ...result.map(item => {
                return {
                    ...item,
                    PK: partitionKey,
                    SK: categoryStorageOperations.createSortKey(item),
                    TYPE: categoryStorageOperations.createType(),
                    tenant,
                    locale
                };
            })
        );
    }
    const items = records.map(record => {
        return categoryStorageOperations.entity.putBatch(record);
    });

    await batchWriteAll({
        table: categoryStorageOperations.table,
        items
    });
};
