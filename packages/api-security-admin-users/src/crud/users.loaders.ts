import DataLoader from "dataloader";
import WebinyError from "@webiny/error";
import { Tenant } from "@webiny/api-tenancy/types";
import { AdminUsersContext, TenantAccess, User, UserStorageOperations } from "~/types";

interface Params {
    context: AdminUsersContext;
    storageOperations: UserStorageOperations;
}
export class UserLoaders {
    private readonly loaders = new Map<string, DataLoader<any, any>>();
    private readonly context: AdminUsersContext;
    private readonly storageOperations: UserStorageOperations;

    constructor(params: Params) {
        this.context = params.context;
        this.storageOperations = params.storageOperations;
    }

    get getUser() {
        if (!this.loaders.get("getUser")) {
            this.loaders.set(
                "getUser",
                new DataLoader<string, User>(this._getUserLoader.bind(this))
            );
        }
        return this.loaders.get("getUser");
    }

    get getUserAccess() {
        if (!this.loaders.get("getUserAccess")) {
            this.loaders.set(
                "getUserAccess",
                new DataLoader<string, TenantAccess>(this._getUserAccess.bind(this))
            );
        }
        return this.loaders.get("getUserAccess");
    }

    private async _getUserLoader(ids) {
        if (ids.length === 0) {
            return [];
        }

        try {
            const results = await this.storageOperations.listUsers({
                where: {
                    tenant: undefined,
                    id_in: ids
                }
            });
            return ids.map(id => {
                const item = results.find(result => result.id === id);
                return item || null;
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute batch read in getUser.",
                ex.code || "BATCH_READ_ERROR",
                {
                    ids
                }
            );
        }
    }

    private async _getUserAccess(ids): Promise<TenantAccess[]> {
        if (ids.length === 0) {
            return [];
        }

        try {
            const results = await this.storageOperations.listUsersLinks({
                where: {
                    id_in: ids
                }
            });
            return ids.map(id => {
                const item = results.find(result => result.id === id);
                return item || null;
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute multiple read in getUserAccess.",
                ex.code || "MULTIPLE_READ_ERROR",
                {
                    ids
                }
            );
        }
    }

    clearLoadersCache(ids: string) {
        for (const id of ids) {
            this.getUser.clear(id);
            this.getUserAccess.clear(id);
        }
    }

    async updateDataLoaderUserCache(id: string, data: Partial<User>) {
        const user = await this.getUser.load(id);
        this.getUser.clear(id).prime(id, {
            ...user,
            ...data
        });
    }

    async addDataLoaderAccessCache(id: string, data: TenantAccess) {
        const access = await this.getUserAccess.load(id);

        this.getUserAccess.clear(id).prime(id, (access || []).concat([data]));
    }

    clearDataLoaderAccessCache(id: string) {
        this.getUserAccess.clear(id);
    }

    async deleteDataLoaderAccessCache(id: string, tenant: Tenant) {
        const access = await this.getUserAccess.load(id);

        const updatedAccess = (access || []).filter(acc => {
            return acc.tenant.id !== tenant.id;
        });

        this.getUserAccess.clear(id).prime(id, updatedAccess);
    }
}
