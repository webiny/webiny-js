import { HeadlessCmsStorageOperations } from "~/types";

interface Params {
    storageOperations: HeadlessCmsStorageOperations;
    tenant: string;
    locale: string;
}

export const listGroupsFromDatabase = async (params: Params) => {
    const { storageOperations, tenant, locale } = params;

    return await storageOperations.groups.list({
        where: {
            tenant,
            locale
        }
    });
};
