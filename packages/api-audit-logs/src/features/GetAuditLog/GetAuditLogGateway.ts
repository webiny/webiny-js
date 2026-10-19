import { AuditLogsStorage } from "~/abstractions.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IStorageFetchParams } from "~/storage/abstractions/Storage.js";
import { GetAuditLogGateway as Abstraction } from "./abstractions.js";

class GetAuditLogGatewayImpl implements Abstraction.Interface {
    public constructor(private readonly storage: AuditLogsStorage.Interface) {}

    public async get(params: IStorageFetchParams): Promise<IAuditLog> {
        const result = await this.storage.fetch(params);
        if (!result.success) {
            throw result.error;
        }
        return result.data;
    }
}

export const GetAuditLogGateway = Abstraction.createImplementation({
    implementation: GetAuditLogGatewayImpl,
    dependencies: [AuditLogsStorage]
});
