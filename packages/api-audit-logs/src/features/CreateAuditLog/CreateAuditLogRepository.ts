import { Result } from "@webiny/feature/api";
import { AuditLogPersistenceError } from "~/domain/errors.js";
import type { IAuditLog } from "~/storage/types.js";
import { CreateAuditLogRepository as Abstraction } from "./abstractions.js";
import { CreateAuditLogGateway } from "./abstractions.js";

class CreateAuditLogRepositoryImpl implements Abstraction.Interface {
    public constructor(private readonly gateway: CreateAuditLogGateway.Interface) {}

    public async create(auditLog: IAuditLog): Promise<Result<IAuditLog, AuditLogPersistenceError>> {
        try {
            const created = await this.gateway.create(auditLog);
            return Result.ok(created);
        } catch (error) {
            return Result.fail(new AuditLogPersistenceError(error as Error));
        }
    }
}

export const CreateAuditLogRepository = Abstraction.createImplementation({
    implementation: CreateAuditLogRepositoryImpl,
    dependencies: [CreateAuditLogGateway]
});
