import { WebinyError } from "@webiny/error";
import type { CreateFlpParams, ListFlpsParams, UpdateFlpParams } from "~/types.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { AcoFlpCrud, FlpStorageOperations } from "~/features/folder/shared/abstractions.js";
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";

/**
 * The FLP catalog records of the current tenant.
 *
 * A DI implementation, not a factory closure: a storage may register the FLP strategy in the root
 * container, while `TenantContext` only exists in the request container. The dependencies are
 * resolved from the container that asks for `AcoFlpCrud`, so the tenant is always the request's.
 */
class FlpCrudImpl implements AcoFlpCrud.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly storageOperations: FlpStorageOperations.Interface
    ) {}

    async create(params: CreateFlpParams) {
        return await this.storageOperations.create({
            data: { ...params, tenant: this.tenantContext.getTenant().id }
        });
    }

    async update(id: string, data: UpdateFlpParams) {
        const original = await this.get(id);
        if (!original) {
            throw new WebinyError(
                `Folder level permission with id "${id}" not found.`,
                "GET_ITEM_UPDATE_FLP_ERROR",
                {
                    id,
                    data
                }
            );
        }

        return await this.storageOperations.update({
            original,
            data: {
                ...data,
                tenant: this.tenantContext.getTenant().id
            }
        });
    }

    async batchUpdate(items: Array<{ id: string; data: UpdateFlpParams }>) {
        const batchItems = (
            await Promise.all(
                items.map(async ({ id, data }) => {
                    const original = await this.get(id);
                    if (!original) {
                        return null;
                    }
                    return {
                        original,
                        data: {
                            ...data,
                            tenant: this.tenantContext.getTenant().id
                        }
                    };
                })
            )
        ).filter((item): item is NonNullable<typeof item> => item !== null);

        if (batchItems.length === 0) {
            return [];
        }

        return await this.storageOperations.batchUpdate({
            items: batchItems
        });
    }

    async delete(id: string) {
        const flp = await this.get(id);
        if (!flp) {
            throw new WebinyError(
                `Folder level permission with id "${id}" not found.`,
                "GET_ITEM_DELETE_FLP_ERROR",
                {
                    id
                }
            );
        }

        await this.storageOperations.delete({
            flp: {
                ...flp,
                tenant: this.tenantContext.getTenant().id
            }
        });

        return true;
    }

    async get(id: string) {
        const entryId = EntryId.from(id);
        return await this.storageOperations.get({
            id: entryId.id,
            tenant: this.tenantContext.getTenant().id
        });
    }

    async list({ where }: ListFlpsParams) {
        return await this.storageOperations.list({
            where: {
                ...where,
                tenant: this.tenantContext.getTenant().id
            }
        });
    }
}

export const FlpCrud = AcoFlpCrud.createImplementation({
    implementation: FlpCrudImpl,
    dependencies: [TenantContext, FlpStorageOperations]
});
