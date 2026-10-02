import { Result } from "@webiny/feature/api";
import { AuditLogsStorage } from "~/abstractions.js";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IAuditLog } from "~/storage/types.js";
import { UpdateAuditLogRepository as Abstraction } from "./abstractions.js";

class UpdateAuditLogRepositoryImpl implements Abstraction.Interface {
    public constructor(private readonly storage: AuditLogsStorage.Interface) {}

    public async update(auditLog: IAuditLog): Promise<Result<IAuditLog, AuditLogPersistenceError>> {
        try {
            const result = await this.storage.store({ data: auditLog });
            if (!result.success) {
                return Result.fail(new AuditLogPersistenceError(result.error));
            }
            return Result.ok(result.data);
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const UpdateAuditLogRepository = Abstraction.createImplementation({
    implementation: UpdateAuditLogRepositoryImpl,
    dependencies: [AuditLogsStorage]
});
