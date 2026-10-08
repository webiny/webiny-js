import { AuditLogsStorage } from "~/abstractions.js";
import type { IAuditLog } from "~/storage/types.js";
import { UpdateAuditLogGateway as Abstraction } from "./abstractions.js";

class UpdateAuditLogGatewayImpl implements Abstraction.Interface {
    public constructor(private readonly storage: AuditLogsStorage.Interface) {}

    public async update(auditLog: IAuditLog): Promise<IAuditLog> {
        const result = await this.storage.store({ data: auditLog });
        if (!result.success) {
            throw result.error;
        }
        return result.data;
    }
}

export const UpdateAuditLogGateway = Abstraction.createImplementation({
    implementation: UpdateAuditLogGatewayImpl,
    dependencies: [AuditLogsStorage]
});
