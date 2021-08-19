import WebinyError from "@webiny/error";
import { CmsContext, CmsSystem, CmsSystemStorageOperations } from "@webiny/api-headless-cms/types";
import configurations from "../../configurations";

interface ConstructorArgs {
    context: CmsContext;
}

const SYSTEM_SECONDARY_KEY = "CMS";

export default class CmsSystemDynamoElastic implements CmsSystemStorageOperations {
    private readonly _context: CmsContext;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        const tenant = this._context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        return `T#${tenant.id}#SYSTEM`;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;
    }

    public async get(): Promise<CmsSystem> {
        const { db } = this.context;
        const [[system]] = await db.read<CmsSystem>({
            ...configurations.db(),
            query: {
                PK: this.partitionKey,
                SK: SYSTEM_SECONDARY_KEY
            }
        });

        return system || null;
    }

    public async create(data: CmsSystem): Promise<void> {
        const { db } = this.context;
        try {
            await db.create({
                ...configurations.db(),
                data: {
                    PK: this.partitionKey,
                    SK: SYSTEM_SECONDARY_KEY,
                    ...data
                }
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create system.",
                ex.code || "CREATE_SYSTEM_ERROR",
                {
                    error: ex,
                    data
                }
            );
        }
    }

    public async update(data: CmsSystem): Promise<void> {
        const { db } = this.context;
        try {
            await db.update({
                ...configurations.db(),
                query: {
                    PK: this.partitionKey,
                    SK: SYSTEM_SECONDARY_KEY
                },
                data
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update system.",
                ex.code || "UPDATE_SYSTEM_ERROR",
                {
                    error: ex,
                    data
                }
            );
        }
    }
}
