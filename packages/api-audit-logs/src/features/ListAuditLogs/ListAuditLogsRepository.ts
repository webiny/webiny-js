import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IListAuditLogsParams } from "~/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import { ListAuditLogsRepository as Abstraction } from "./abstractions.js";
import { ListAuditLogsGateway } from "./abstractions.js";
import type { ListAuditLogsOutput } from "./abstractions.js";

class ListAuditLogsRepositoryImpl implements Abstraction.Interface {
    public constructor(
        private readonly gateway: ListAuditLogsGateway.Interface,
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

            const { items, meta } = await this.gateway.list(storageParams);

            return Result.ok({
                items,
                meta: {
                    cursor: meta.after || null,
                    hasMoreItems: meta.hasMoreItems
                }
            });
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const ListAuditLogsRepository = Abstraction.createImplementation({
    implementation: ListAuditLogsRepositoryImpl,
    dependencies: [ListAuditLogsGateway, TenantContext]
});
