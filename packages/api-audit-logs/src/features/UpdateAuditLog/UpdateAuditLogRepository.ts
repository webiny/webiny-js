import { Result } from "@webiny/feature/api";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IAuditLog } from "~/storage/types.js";
import { UpdateAuditLogRepository as Abstraction } from "./abstractions.js";
import { UpdateAuditLogGateway } from "./abstractions.js";

class UpdateAuditLogRepositoryImpl implements Abstraction.Interface {
    public constructor(private readonly gateway: UpdateAuditLogGateway.Interface) {}

    public async update(auditLog: IAuditLog): Promise<Result<IAuditLog, AuditLogPersistenceError>> {
        try {
            const updated = await this.gateway.update(auditLog);
            return Result.ok(updated);
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const UpdateAuditLogRepository = Abstraction.createImplementation({
    implementation: UpdateAuditLogRepositoryImpl,
    dependencies: [UpdateAuditLogGateway]
});
