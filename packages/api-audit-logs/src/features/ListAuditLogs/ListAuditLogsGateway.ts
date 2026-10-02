import { AuditLogsStorage } from "~/abstractions.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import { ListAuditLogsGateway as Abstraction } from "./abstractions.js";

class ListAuditLogsGatewayImpl implements Abstraction.Interface {
    public constructor(private readonly storage: AuditLogsStorage.Interface) {}

    public async list(params: IStorageListParams): Promise<Abstraction.Output> {
        const result = await this.storage.list(params);
        if (!result.success) {
            throw result.error;
        }
        return {
            items: result.data,
            meta: result.meta
        };
    }
}

export const ListAuditLogsGateway = Abstraction.createImplementation({
    implementation: ListAuditLogsGatewayImpl,
    dependencies: [AuditLogsStorage]
});
