import {
    I18NContext,
    I18NSystem,
    I18NSystemStorageOperations,
    I18NSystemStorageOperationsCreate,
    I18NSystemStorageOperationsUpdate
} from "@webiny/api-i18n/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineSystemEntity from "~/definitions/systemEntity";
import defineTable from "~/definitions/table";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";

interface ConstructorParams {
    context: I18NContext;
}

const SORT_KEY = "I18N";

export class SystemStorageOperations implements I18NSystemStorageOperations {
    private readonly _context: I18NContext;
    private readonly _entity: Entity<any>;

    private get partitionKey(): string {
        const tenant = this._context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        return `T#${tenant.id}#SYSTEM`;
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

    public async get(): Promise<I18NSystem> {
        const keys = {
            PK: this.partitionKey,
            SK: SORT_KEY
        };

        try {
            const result = await this._entity.get(keys);

            return cleanupItem(this._entity, result?.Item);
        } catch (ex) {
            throw new WebinyError(
                "Could not load system data from the database.",
                "GET_SYSTEM_ERROR",
                keys
            );
        }
    }

    public async create({ system }: I18NSystemStorageOperationsCreate): Promise<I18NSystem> {
        const keys = {
            PK: this.partitionKey,
            SK: SORT_KEY
        };
        try {
            await this._entity.put({
                ...keys,
                ...system
            });
            return system;
        } catch (ex) {
            throw new WebinyError(
                "Could not create system data in the database.",
                "CREATE_SYSTEM_ERROR",
                keys
            );
        }
    }

    public async update({ system }: I18NSystemStorageOperationsUpdate): Promise<I18NSystem> {
        const keys = {
            PK: this.partitionKey,
            SK: SORT_KEY
        };
        try {
            await this._entity.put({
                ...keys,
                ...system
            });
            return system;
        } catch (ex) {
            throw new WebinyError(
                "Could not update system data in the database.",
                "UPDATE_VERSION_ERROR",
                keys
            );
        }
    }
}
