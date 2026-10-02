import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { AuditLogsStorage } from "~/abstractions.js";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IAuditLog } from "~/storage/types.js";
import { GetAuditLogRepository as Abstraction } from "./abstractions.js";

class GetAuditLogRepositoryImpl implements Abstraction.Interface {
    public constructor(
        private readonly storage: AuditLogsStorage.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public async get(id: string): Promise<Result<IAuditLog, AuditLogPersistenceError>> {
        try {
            const tenant = this.tenantContext.getTenant().id;
            const result = await this.storage.fetch({ id, tenant });
            if (!result.success) {
                return Result.fail(new AuditLogPersistenceError(result.error));
            }
            return Result.ok(result.data);
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const GetAuditLogRepository = Abstraction.createImplementation({
    implementation: GetAuditLogRepositoryImpl,
    dependencies: [AuditLogsStorage, TenantContext]
});
