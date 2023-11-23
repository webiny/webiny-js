import { createLocaleEntity, createTenantEntity, queryAll } from "~/utils";
import { I18NLocale, Tenant } from "~/migrations/5.37.0/003/types";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { Logger } from "@webiny/logger";

type ForEachTenantLocaleCallback = (params: {
    tenantId: string;
    localeCode: string;
}) => boolean | Promise<boolean>;

interface ForEachTenantLocaleParams {
    table: Table<string, string, string>;
    logger: Logger;
    callback: ForEachTenantLocaleCallback;
}

export const forEachTenantLocale = async ({
    table,
    logger,
    callback
}: ForEachTenantLocaleParams) => {
    const tenantEntity = createTenantEntity(table);
    const tenants = await queryAll<Tenant>({
        entity: tenantEntity,
        partitionKey: "TENANTS",
        options: {
            index: "GSI1",
            gte: " "
        }
    });

    if (tenants.length === 0) {
        logger.info(`No tenants found in the system.`);
        return;
    }

    const localeEntity = createLocaleEntity(table);

    for (const tenant of tenants) {
        const locales = await queryAll<I18NLocale>({
            entity: localeEntity,
            partitionKey: `T#${tenant.data.id}#I18N#L`,
            options: {
                gte: " "
            }
        });

        if (locales.length === 0) {
            logger.info(`No locales found in tenant "${tenant.data.id}".`);
            continue;
        }

        for (const locale of locales) {
            const result = await callback({ tenantId: tenant.data.id, localeCode: locale.code });
            // For now, we only check if the return value is `false`. If so, we stop
            // iterating over the locales and tenants completely. If needed, we could
            // add more control over the iteration process.
            if (result === false) {
                return;
            }
        }
    }
};
