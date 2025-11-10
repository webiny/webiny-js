import type { HeadlessCmsStorageOperations } from "~/types/index.js";

interface Params {
    storageOperations: HeadlessCmsStorageOperations;
    tenant: string;
}

export const listGroupsFromDatabase = async (params: Params) => {
    const { storageOperations, tenant } = params;

    return await storageOperations.groups.list({
        where: {
            tenant
        }
    });
};
