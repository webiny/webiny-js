import DataLoader from "dataloader";
import Error from "@webiny/error";
import flatten from "lodash/flatten";
import { AdminUsersStorageOperations, AdminUser } from "~/types";

interface Config {
    getTenant(): string;
    storageOperations: AdminUsersStorageOperations;
}

interface Key {
    id: string;
    tenant: string;
}

export const createUserLoaders = ({ storageOperations }: Config) => {
    const loaders = new Map<string, DataLoader<any, any>>();

    async function getUserLoader(ids: Array<Key>) {
        if (ids.length === 0) {
            return [];
        }

        // Group by tenant
        const byTenant = ids.reduce((acc, item) => {
            acc[item.tenant] = [...(acc[item.tenant] || []), item.id];
            return acc;
        }, {} as Record<string, string[]>);

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
                return results.find(item => item.id === id && item.tenant === tenant);
            });
        } catch (err) {
            throw Error.from(err, {
                message: "Could not execute batch read in getUser.",
                code: "BATCH_READ_ERROR",
                data: { ids }
            });
        }
    }

    return {
        get getUser() {
            if (!loaders.get("getUser")) {
                loaders.set(
                    "getUser",
                    new DataLoader<Key, AdminUser, string>(getUserLoader, {
                        cacheKeyFn(key) {
                            return `${key.tenant}:${key.id}`;
                        }
                    })
                );
            }
            return loaders.get("getUser");
        },

        clearLoadersCache(ids: Key[]) {
            for (const id of ids) {
                this.getUser.clear(id);
            }
        },

        async updateDataLoaderUserCache(id: Key, data: Partial<AdminUser>) {
            const user = await this.getUser.load(id);
            this.getUser.clear(id).prime(id, Object.assign({}, user, data));
        }
    };
};
