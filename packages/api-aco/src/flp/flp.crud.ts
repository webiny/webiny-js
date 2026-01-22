import { WebinyError } from "@webiny/error";
import {
    type AcoFolderLevelPermissionsCrud,
    type AcoStorageOperations,
    type CreateFlpParams,
    type UpdateFlpParams
} from "~/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export interface CreateFlpCrudMethodsParams {
    getTenant: () => Tenant;
    storageOperations: AcoStorageOperations;
}

export const createFlpCrudMethods = ({
    storageOperations,
    getTenant
}: CreateFlpCrudMethodsParams): AcoFolderLevelPermissionsCrud => {
    return {
        async create(params: CreateFlpParams) {
            return await storageOperations.flp.create({
                data: { ...params, tenant: getTenant().id }
            });
        },
        async update(id: string, data: UpdateFlpParams) {
            const original = await this.get(id);
            if (!original) {
                throw new WebinyError(
                    `Folder level permission with id "${id}" not found.`,
                    "GET_ITEM_UPDATE_FLP_ERROR",
                    {
                        id,
                        data
                    }
                );
            }

            return await storageOperations.flp.update({
                original,
                data: {
                    ...data,
                    tenant: getTenant().id
                }
            });
        },
        async batchUpdate(items: Array<{ id: string; data: UpdateFlpParams }>) {
            const batchItems = (
                await Promise.all(
                    items.map(async ({ id, data }) => {
                        const original = await this.get(id);
                        if (!original) {
                            return null;
                        }
                        return {
                            original,
                            data: {
                                ...data,
                                tenant: getTenant().id
                            }
                        };
                    })
                )
            ).filter((item): item is NonNullable<typeof item> => item !== null);

            if (batchItems.length === 0) {
                return [];
            }

            return await storageOperations.flp.batchUpdate({
                items: batchItems
            });
        },
        async delete(id: string) {
            const flp = await this.get(id);
            if (!flp) {
                throw new WebinyError(
                    `Folder level permission with id "${id}" not found.`,
                    "GET_ITEM_DELETE_FLP_ERROR",
                    {
                        id
                    }
                );
            }

            await storageOperations.flp.delete({
                flp: {
                    ...flp,
                    tenant: getTenant().id
                }
            });

            return true;
        },
        async get(id: string) {
            return await storageOperations.flp.get({
                id,
                tenant: getTenant().id
            });
        },
        async list({ where }) {
            return await storageOperations.flp.list({
                where: {
                    ...where,
                    tenant: getTenant().id
                }
            });
        }
    };
};
