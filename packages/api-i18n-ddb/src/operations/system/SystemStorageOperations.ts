import {
    I18NContext,
    I18NSystem,
    I18NSystemStorageOperations,
} from "@webiny/api-i18n/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineSystemEntity from "~/definitions/systemEntity";
import defineTable from "~/definitions/table";

interface ConstructorParams {
    context: I18NContext;
}

const SORT_KEY = "I18N";

export class SystemStorageOperations implements I18NSystemStorageOperations {
    private readonly _context: I18NContext;
    private _partitionKey: string;
    private readonly _entity: Entity<any>;

    private get partitionKey(): string {
        if (!this._partitionKey) {
            const tenant = this._context.tenancy.getCurrentTenant();
            if (!tenant) {
                throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
            }
            this._partitionKey = `T#${tenant.id}#SYSTEM`;
        }
        return this._partitionKey;
    }

    public constructor({ context }: ConstructorParams) {
        this._context = context;
        const table = defineTable({
            context
        });

        this._entity = defineSystemEntity({
            context,
            table
        });
    }

    
    public async getVersion(): Promise<string | null> {
        const keys = {
            PK: this.partitionKey,
            SK: SORT_KEY,
        };
        try {
            const result = await this._entity.get(keys);
            
            
            const item = this.cleanupItem(result?.Item);
            return item?.version || null;
        } catch(ex) {
            throw new WebinyError(
                "Could not read system data from the database.",
                "GET_VERSION_ERROR",
                keys,
            );
        }
    }
    
    public async setVersion(version: string): Promise<void> {
        const keys = {
            PK: this.partitionKey,
            SK: SORT_KEY,
        };
        try {
            await this._entity.put({
                ...keys,
                version,
            });
        } catch(ex) {
            throw new WebinyError(
                "Could not set system data in the database.",
                "SET_VERSION_ERROR",
                keys,
            );
        }
    }
    
    private cleanupItem(item?: I18NSystem & Record<string, any>): I18NSystem | null {
        if (!item) {
            return null;
        }
        return Object.keys(this._entity.schema.attributes).reduce((values, attr) => {
            const attribute = this._entity.attribute(attr);
            if (attribute.partitionKey || attribute.sortKey) {
                return values;
            }
            return {
                ...values,
                [attr]: item[attr],
            }
        }, {} as I18NSystem);
    }
}
