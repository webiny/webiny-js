import {
    I18NContext,
    I18NSystem,
    I18NSystemStorageOperations,
    I18NSystemStorageOperationsCreate,
    I18NSystemStorageOperationsUpdate
} from "@webiny/api-i18n/types";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import WebinyError from "@webiny/error";
import defineSystemEntity from "~/definitions/systemEntity";
import defineTable from "~/definitions/table";
import { getClean, put } from "@webiny/db-dynamodb";

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

    public async get() {
        const keys = {
            PK: this.partitionKey,
            SK: SORT_KEY
        };

        try {
            return await getClean<I18NSystem>({
                entity: this._entity,
                keys
            });
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
            await put({
                entity: this._entity,
                item: {
                    ...system,
                    ...keys
                }
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
            await put({
                entity: this._entity,
                item: {
                    ...system,
                    ...keys
                }
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
