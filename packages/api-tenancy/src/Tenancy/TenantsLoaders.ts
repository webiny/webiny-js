import DataLoader from "dataloader";
import Error from "@webiny/error";
import { Tenant, TenantsStorageOperations } from "~/types";

export class TenantsLoaders {
    private readonly loaders = new Map<string, DataLoader<any, any>>();
    private storage: TenantsStorageOperations;

    setStorageOperations(storage: TenantsStorageOperations) {
        this.storage = storage;
    }

    get getTenant() {
        if (!this.storage) {
            throw new Error(
                "Missing TenantsStorageOperations in TenantsLoaders.",
                "MISSING_STORAGE_OPERATIONS"
            );
        }
        if (!this.loaders.get("getTenant")) {
            this.loaders.set(
                "getTenant",
                new DataLoader<string, Tenant>(ids => this._getTenant(ids))
            );
        }
        return this.loaders.get("getTenant");
    }

    private async _getTenant(ids) {
        if (ids.length === 0) {
            return [];
        }

        const tenants = await this.storage.getTenantsByIds(ids);

        return ids.map((id, index) => tenants[index]);
    }
}
