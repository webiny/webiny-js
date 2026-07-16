import { ListAuditLogsGateway } from "./abstractions/index.js";
import { ListAuditLogsRepository as RepositoryAbstraction } from "./abstractions/index.js";
import { listAuditLogsSchema } from "~/hooks/schema.js";
import { transformRawAuditLog } from "~/utils/transformRawAuditLog.js";

class ListAuditLogsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private readonly gateway: ListAuditLogsGateway.Interface) {}

    async execute(params: RepositoryAbstraction.Params): Promise<RepositoryAbstraction.Result> {
        const response = await this.gateway.execute(params);

        const parsed = listAuditLogsSchema.safeParse(response.data);
        if (!parsed.success) {
            console.error(parsed.error);
            return {
                records: [],
                meta: response.meta
            };
        }

        const records = parsed.data.map(auditLog => transformRawAuditLog({ auditLog }));

        return {
            records,
            meta: response.meta
        };
    }
}

export const ListAuditLogsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListAuditLogsRepositoryImpl,
    dependencies: [ListAuditLogsGateway]
});
