import gql from "graphql-tag";
import type { IAuditLogRaw, IAuditLogsError, IAuditLogsMeta } from "~/types.js";

export interface IListAuditLogsVariablesWhere {
    app?: string;
    action?: string;
    createdBy?: string;
    entity?: string;
    entityId?: string;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}

export interface IListAuditLogsVariables {
    where: Partial<IListAuditLogsVariablesWhere>;
    after: string | undefined;
    sort: "ASC" | "DESC" | undefined;
    limit: number | undefined;
}

export type IListAuditLogsVariablesPartial = Partial<IListAuditLogsVariables>;

export interface IListAuditLogsResponse {
    auditLogs: {
        listAuditLogs: {
            data: IAuditLogRaw[] | null;
            meta: IAuditLogsMeta | null;
            error: IAuditLogsError | null;
        };
    };
}

export const LIST_AUDIT_LOGS = gql`
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
