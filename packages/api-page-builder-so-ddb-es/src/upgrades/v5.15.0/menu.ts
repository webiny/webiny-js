import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { MenuStorageOperationsDdbEs } from "~/operations/menu/MenuStorageOperations";
import { Menu } from "@webiny/api-page-builder/types";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import WebinyError from "@webiny/error";

type DbRecord<T> = T & {
    PK: string;
    SK: string;
    TYPE: string;
};

export const upgradeMenus = async (context: PbContext) => {
    const tenant: string = context.tenancy.getCurrentTenant().id;
    const localeCodes: string[] = await context.i18n.getLocales().map(locale => locale.code);
    const menuStorageOperations = context.pageBuilder.menus
        .storageOperations as MenuStorageOperationsDdbEs;
    if (menuStorageOperations instanceof MenuStorageOperationsDdbEs === false) {
        throw new WebinyError(
            "context.pageBuilder.menus.storageOperations must be instance of MenuStorageOperationsDdbEs."
        );
    }
    /**
     * First we need all categories in all existing locales of the tenant.
     */
    const records: DbRecord<Menu>[] = [];
    for (const locale of localeCodes) {
        const partitionKey = menuStorageOperations.createPartitionKey({
            tenant,
            locale
        });
        const result = await queryAll<Menu>({
            entity: menuStorageOperations.entity,
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
                    SK: menuStorageOperations.createSortKey(item),
                    TYPE: menuStorageOperations.createType(),
                    tenant,
                    locale
                };
            })
        );
    }
    const items = records.map(record => {
        return menuStorageOperations.entity.putBatch(record);
    });

    await batchWriteAll({
        table: menuStorageOperations.table,
        items
    });
};
