import DataLoader from "dataloader";
import Error from "@webiny/error";
import { AdminUsersStorageOperations, AdminUser } from "~/types";

interface Config {
    getTenant(): string;
    storageOperations: AdminUsersStorageOperations;
}

export const createUserLoaders = ({ getTenant, storageOperations }: Config) => {
    const loaders = new Map<string, DataLoader<any, any>>();

    async function getUserLoader(ids) {
        if (ids.length === 0) {
            return [];
        }

        try {
            const results = await storageOperations.listUsers({
                where: {
                    tenant: getTenant(),
                    id_in: ids
                }
            });

            return ids.map(id => results.find(result => result.id === id));
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
                loaders.set("getUser", new DataLoader<string, AdminUser>(getUserLoader));
            }
            return loaders.get("getUser");
        },

        clearLoadersCache(ids: string) {
            for (const id of ids) {
                this.getUser.clear(id);
            }
        },

        async updateDataLoaderUserCache(id: string, data: Partial<AdminUser>) {
            const user = await this.getUser.load(id);
            this.getUser.clear(id).prime(id, Object.assign({}, user, data));
        }
    };
};
