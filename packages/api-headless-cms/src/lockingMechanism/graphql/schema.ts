import { createCmsGraphQLSchemaPlugin } from "~/plugins";
import { resolve } from "~/graphql/utils/resolve";

export const createGraphQLSchema = () => {
    const plugin = createCmsGraphQLSchemaPlugin({
        endpoint: "manage",
        typeDefs: /* GraphQL */ `
            type CmsLockRecord {
                id: ID!
                targetId: String!
                type: String!
                lockedBy: CmsIdentity!
                lockedOn: DateTime!
            }

            type CmsIsEntryLockedResponse {
                data: Boolean
                error: CmsError
            }

            type CmsLockRecordResponse {
                data: CmsLockRecord
                error: CmsError
            }

            type CmsLockEntryResponse {
                data: CmsLockRecord
                error: CmsError
            }

            type CmsUnlockEntryResponse {
                data: Boolean
                error: CmsError
            }

            extend type Query {
                isEntryLocked(id: ID!, type: String!): CmsIsEntryLockedResponse!
                getLockRecord(id: ID!): CmsLockRecordResponse!
            }

            extend type Mutation {
                lockEntry(id: ID!, type: String!): CmsLockEntryResponse!
                unlockEntry(id: ID!, type: String!): CmsUnlockEntryResponse!
            }
        `,
        resolvers: {
            Query: {
                isEntryLocked: async (_, args, context) => {
                    return resolve(async () => {
                        return context.cms.locking.isEntryLocked({
                            id: args.id,
                            type: args.type
                        });
                    });
                },
                getLockRecord: async (_, args, context) => {
                    return resolve(async () => {
                        return context.cms.locking.getLockRecord(args.id);
                    });
                }
            },
            Mutation: {
                lockEntry: async (_, args, context) => {
                    return resolve(async () => {
                        return context.cms.locking.lockEntry({
                            id: args.id,
                            type: args.type
                        });
                    });
                },
                unlockEntry: async (_, args, context) => {
                    return resolve(async () => {
                        return await context.cms.locking.unlockEntry({
                            id: args.id,
                            type: args.type
                        });
                    });
                }
            }
        }
    });

    plugin.name = "headlessCms.graphql.schema.lockingMechanism";

    return plugin;
};
