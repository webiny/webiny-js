import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IAuditLog } from "~/storage/types.js";
import { GetAuditLogRepository as Abstraction } from "./abstractions.js";
import { GetAuditLogGateway } from "./abstractions.js";

class GetAuditLogRepositoryImpl implements Abstraction.Interface {
    public constructor(
        private readonly gateway: GetAuditLogGateway.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public async get(id: string): Promise<Result<IAuditLog, AuditLogPersistenceError>> {
        try {
            const tenant = this.tenantContext.getTenant().id;
            const auditLog = await this.gateway.get({ id, tenant });
            return Result.ok(auditLog);
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const GetAuditLogRepository = Abstraction.createImplementation({
    implementation: GetAuditLogRepositoryImpl,
    dependencies: [GetAuditLogGateway, TenantContext]
});
