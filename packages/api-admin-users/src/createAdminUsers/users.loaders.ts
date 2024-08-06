import DataLoader from "dataloader";
import WebinyError from "@webiny/error";
import flatten from "lodash/flatten";
import { AdminUsersStorageOperations, AdminUser } from "~/types";

interface Config {
    getTenant(): string;
    storageOperations: AdminUsersStorageOperations;
}

interface GetUserLoaderKey {
    id: string;
    tenant: string;
}

export const createUserLoaders = ({ storageOperations }: Config) => {
    const loaders = new Map<string, DataLoader<any, any>>();

    async function getUserLoader(ids: readonly GetUserLoaderKey[]) {
        if (ids.length === 0) {
            return [];
        }

        // Group by tenant
        const byTenant = ids.reduce(
            (acc, item) => {
                acc[item.tenant] = [...(acc[item.tenant] || []), item.id];
                return acc;
            },
            {} as Record<string, string[]>
        );

        try {
            const results = await Promise.all(
                Object.keys(byTenant).map(tenant => {
                    return storageOperations.listUsers({
                        where: {
                            tenant,
                            id_in: byTenant[tenant]
                        }
                    });
                })
            ).then(res => flatten(res));

            return ids.map(({ tenant, id }) => {
                const user = results.find(item => item.id === id && item.tenant === tenant);
                /**
                 * Casting because DataLoader expect error. But we do not.
                 */
                return user || (null as unknown as Error);
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not execute batch read in getUser.",
                code: "BATCH_READ_ERROR",
                data: { ids }
            });
        }
    }

    return {
        get getUser() {
            let userLoader = loaders.get("getUser");
            if (userLoader) {
                return userLoader;
            }
            userLoader = new DataLoader<GetUserLoaderKey, AdminUser, string>(getUserLoader, {
                cacheKeyFn(key) {
                    return `${key.tenant}:${key.id}`;
                }
            });
            loaders.set("getUser", userLoader);
            return userLoader;
        },

        clearLoadersCache(ids: GetUserLoaderKey[]) {
            for (const id of ids) {
                this.getUser.clear(id);
            }
        },

        async updateDataLoaderUserCache(id: GetUserLoaderKey, data: Partial<AdminUser>) {
            const user = await this.getUser.load(id);
            this.getUser.clear(id).prime(id, Object.assign({}, user, data));
        }
    };
};
