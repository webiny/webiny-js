import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { AuditLogsStorage } from "~/abstractions.js";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IListAuditLogsParams } from "~/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import { ListAuditLogsRepository as Abstraction } from "./abstractions.js";
import type { ListAuditLogsOutput } from "./abstractions.js";

class ListAuditLogsRepositoryImpl implements Abstraction.Interface {
    public constructor(
        private readonly storage: AuditLogsStorage.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public async list(
        params: IListAuditLogsParams
    ): Promise<Result<ListAuditLogsOutput, AuditLogPersistenceError>> {
        try {
            const storageParams = {
                ...params,
                tenant: this.tenantContext.getTenant().id
            } as unknown as IStorageListParams;

            const result = await this.storage.list(storageParams);
            if (!result.success) {
                return Result.fail(new AuditLogPersistenceError(result.error));
            }

            return Result.ok({
                items: result.data,
                meta: {
                    cursor: result.meta.after || null,
                    hasMoreItems: result.meta.hasMoreItems
                }
            });
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const ListAuditLogsRepository = Abstraction.createImplementation({
    implementation: ListAuditLogsRepositoryImpl,
    dependencies: [AuditLogsStorage, TenantContext]
});
