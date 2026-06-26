import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { IAuditLogRaw, IAuditLogsMeta, IAuditLogsError } from "~/types.js";
import { ListAuditLogsGateway as GatewayAbstraction } from "./abstractions/index.js";

const LIST_AUDIT_LOGS = /* GraphQL */ `
    query ListAuditLogs(
        $where: ListAuditLogsWhere!
        $sort: AuditLogsSort
        $after: String
        $limit: Number
    ) {
        auditLogs {
            listAuditLogs(where: $where, after: $after, sort: $sort, limit: $limit) {
                data {
                    id
                    createdBy {
                        id
                        displayName
                        type
                    }
                    createdOn
                    app
                    action
                    message
                    entity
                    entityId
                    tags
                    expiresAt
                    content
                }
                meta {
                    hasMoreItems
                    cursor
                }
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;

interface ListAuditLogsResponse {
    auditLogs: {
        listAuditLogs: {
            data: IAuditLogRaw[] | null;
            meta: IAuditLogsMeta | null;
            error: IAuditLogsError | null;
        };
    };
}

class ListAuditLogsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(params: GatewayAbstraction.Params): Promise<GatewayAbstraction.Result> {
        const response = await this.client.execute<ListAuditLogsResponse>({
            query: LIST_AUDIT_LOGS,
            variables: params
        });

        const envelope = response.auditLogs.listAuditLogs;

        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not fetch audit logs.");
        }

        return {
            data: envelope.data || [],
            meta: envelope.meta || { hasMoreItems: false, cursor: null }
        };
    }
}

export const ListAuditLogsGateway = GatewayAbstraction.createImplementation({
    implementation: ListAuditLogsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
