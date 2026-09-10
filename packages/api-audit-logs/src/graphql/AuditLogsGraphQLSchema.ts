import { NotFoundError, resolve, resolveList } from "@webiny/api-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { createZodError } from "@webiny/utils";
import { AuditLogsContext } from "~/abstractions.js";
import type { AuditLogsContextValue } from "~/types.js";
import { getValidationSchema, listValidationSchema } from "./validation.js";

interface IListAuditLogsWhere {
    app?: string;
    action?: string;
    createdBy?: string;
    entity?: string;
    entityId?: string;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}

interface IListAuditLogsArgs {
    where?: IListAuditLogsWhere;
    sort?: "ASC" | "DESC";
    limit?: number;
    after?: string;
}

const TYPE_DEFS = /* GraphQL */ `
    type AuditLogCreatedBy {
        id: ID!
        displayName: String
        type: String
    }
    type AuditLog {
        id: ID!
        createdBy: AuditLogCreatedBy!
        createdOn: DateTime!
        app: String!
        action: String!
        message: String!
        entity: String!
        entityId: String!
        tags: [String!]!
        expiresAt: DateTime!
        content: String
    }

    type AuditLogListMeta {
        cursor: String
        hasMoreItems: Boolean!
    }

    type AuditLogError {
        code: String
        message: String!
        data: JSON
        stack: String
    }

    type AuditLogListResponse {
        data: [AuditLog!]
        meta: AuditLogListMeta
        error: AuditLogError
    }

    type AuditLogGetResponse {
        data: AuditLog
        error: AuditLogError
    }

    enum AuditLogsSort {
        ASC
        DESC
    }

    input ListAuditLogsWhere {
        app: String
        action: String
        createdBy: String
        entity: String
        entityId: String
        createdOn_gte: DateTime
        createdOn_lte: DateTime
    }

    type AuditLogsQuery {
        getAuditLog(id: ID!): AuditLogGetResponse
        listAuditLogs(
            where: ListAuditLogsWhere
            sort: AuditLogsSort
            limit: Number
            after: String
        ): AuditLogListResponse!
    }

    extend type Query {
        auditLogs: AuditLogsQuery
    }
`;

class AuditLogsGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(TYPE_DEFS);

        builder.addResolver({
            path: "Query.auditLogs",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<{ id: string }>({
            path: "AuditLogsQuery.getAuditLog",
            dependencies: [AuditLogsContext],
            resolver(auditLogs: AuditLogsContextValue) {
                return async ({ args }) => {
                    return resolve(async () => {
                        const validation = await getValidationSchema.safeParseAsync(args);

                        if (!validation.success) {
                            throw createZodError(validation.error);
                        }

                        const result = await auditLogs.getAuditLog(validation.data.id);
                        if (!result) {
                            throw new NotFoundError(
                                `Audit log with id "${validation.data.id}" not found.`
                            );
                        }
                        return result;
                    });
                };
            }
        });

        builder.addResolver<IListAuditLogsArgs>({
            path: "AuditLogsQuery.listAuditLogs",
            dependencies: [AuditLogsContext],
            resolver(auditLogs: AuditLogsContextValue) {
                return async ({ args }) => {
                    return resolveList(async () => {
                        const validation = await listValidationSchema.safeParseAsync(args);
                        if (!validation.success) {
                            throw createZodError(validation.error);
                        }
                        const result = await auditLogs.listAuditLogs({
                            ...validation.data,
                            ...validation.data.where
                        });
                        if (result.error) {
                            throw result.error;
                        }
                        return {
                            items: result.items,
                            meta: {
                                ...result.meta,
                                totalCount: 0
                            }
                        };
                    });
                };
            }
        });

        return builder;
    }
}

export const AuditLogsGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: AuditLogsGraphQLSchemaImpl,
    dependencies: []
});
