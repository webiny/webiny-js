import DataLoader from "dataloader";
import { Tenant } from "./types";
import { DbContext } from "@webiny/handler-db/types";
import { dbArgs } from "./dbArgs";

export class TenancyLoaders {
    private readonly _loaders = new Map<string, DataLoader<any, any>>();
    private _context: DbContext;

    constructor(context: DbContext) {
        this._context = context;
    }

    get getTenant() {
        if (!this._loaders.get("getTenant")) {
            this._loaders.set(
                "getTenant",
                new DataLoader<string, Tenant>(this._getTenant.bind(this))
            );
        }
        return this._loaders.get("getTenant");
    }

    private async _getTenant(ids) {
        if (ids.length === 0) {
            return [];
        }

        const batch = this._context.db.batch();
        for (let i = 0; i < ids.length; i++) {
            batch.read({
                ...dbArgs,
                query: { PK: `T#${ids[i]}`, SK: "A" }
            });
        }

        const results = await batch.execute();
        return results.map(([response]) => response[0]);
    }
}
