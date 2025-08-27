import { GraphQLSchemaPlugin, NotFoundError, resolve, resolveList } from "@webiny/handler-graphql";
import type { AuditLogsContext } from "~/types.js";
import { getValidationSchema, listValidationSchema } from "./validation.js";
import { createZodError } from "@webiny/utils";

export const createGraphQLSchema = () => {
    return new GraphQLSchemaPlugin<AuditLogsContext>({
        isApplicable: context => {
            return !!context.auditLogs;
        },
        typeDefs: `
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
                expiresAt: DateTime
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
                meta: AuditLogListMeta!
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
            
            extend type Query {
                getAuditLog(id: ID!): AuditLogGetResponse
                listAuditLogs(
                    app: String
                    createdBy: String
                    action: String
                    entryId: String
                    after: String
                    order: AuditLogsSort
                    version: Number
                    createdOn_gte: DateTime
                    createdOn_lte: DateTime
                    limit: Number
                ): AuditLogListResponse!
            }
        `,
        resolvers: {
            Query: {
                async getAuditLog(_, args, context) {
                    return resolve(async () => {
                        const validation = await getValidationSchema.safeParseAsync(args);

                        if (!validation.success) {
                            throw createZodError(validation.error);
                        }

                        const result = await context.auditLogs.getAuditLog(validation.data.id);
                        if (!result) {
                            throw new NotFoundError(
                                `Audit log with id "${validation.data.id}" not found.`
                            );
                        }
                        return result;
                    });
                },
                async listAuditLogs(_, args, context) {
                    return resolveList(async () => {
                        const validation = await listValidationSchema.safeParseAsync(args);
                        if (!validation.success) {
                            throw createZodError(validation.error);
                        }
                        const result = await context.auditLogs.listAuditLogs(validation.data);
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
                }
            }
        }
    });
};
