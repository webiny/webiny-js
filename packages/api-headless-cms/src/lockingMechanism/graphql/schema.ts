import { resolve } from "~/graphql/utils/resolve";
import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";
import { createGraphQLSchemaPlugin, NotFoundError } from "@webiny/handler-graphql";

export const createGraphQLSchema = (): ContextPlugin<CmsContext> => {
    const contextPlugin = new ContextPlugin<CmsContext>(async context => {
        const plugin = createGraphQLSchemaPlugin<CmsContext>({
            typeDefs: /* GraphQL */ `
                enum CmsLockRecordActionType {
                    requested
                    approved
                    denied
                }

                type CmsLockRecordAction {
                    id: ID!
                    type: CmsLockRecordActionType!
                    message: String
                    createdBy: CmsIdentity!
                    createdOn: DateTime!
                }

                type CmsLockRecord {
                    id: ID!
                    targetId: String!
                    type: String!
                    lockedBy: CmsIdentity!
                    lockedOn: DateTime!
                    actions: [CmsLockRecordAction!]
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

                type CmsUnlockEntryRequestResponse {
                    data: CmsLockRecord
                    error: CmsError
                }

                type LockingMechanismQuery {
                    _empty: String
                }

                type LockingMechanismMutation {
                    _empty: String
                }

                extend type LockingMechanismQuery {
                    isEntryLocked(id: ID!, type: String!): CmsIsEntryLockedResponse!
                    getLockRecord(id: ID!): CmsLockRecordResponse!
                }

                extend type LockingMechanismMutation {
                    lockEntry(id: ID!, type: String!): CmsLockEntryResponse!
                    unlockEntry(id: ID!, type: String!): CmsUnlockEntryResponse!
                    unlockEntryRequest(id: ID!, type: String!): CmsUnlockEntryRequestResponse!
                }

                extend type Query {
                    lockingMechanism: LockingMechanismQuery
                }

                extend type Mutation {
                    lockingMechanism: LockingMechanismMutation
                }
            `,
            resolvers: {
                Query: {
                    lockingMechanism: async () => ({})
                },
                Mutation: {
                    lockingMechanism: async () => ({})
                },
                LockingMechanismQuery: {
                    async isEntryLocked(_, args, context) {
                        return resolve(async () => {
                            return context.cms.lockingMechanism.isEntryLocked({
                                id: args.id,
                                type: args.type
                            });
                        });
                    },
                    async getLockRecord(_, args, context) {
                        return resolve(async () => {
                            const result = await context.cms.lockingMechanism.getLockRecord(
                                args.id
                            );
                            if (result) {
                                return result;
                            }
                            throw new NotFoundError("Lock record not found.");
                        });
                    }
                },
                LockingMechanismMutation: {
                    async lockEntry(_, args, context) {
                        return resolve(async () => {
                            return context.cms.lockingMechanism.lockEntry({
                                id: args.id,
                                type: args.type
                            });
                        });
                    },
                    async unlockEntry(_, args, context) {
                        return resolve(async () => {
                            await context.cms.lockingMechanism.unlockEntry({
                                id: args.id,
                                type: args.type
                            });
                            return true;
                        });
                    },
                    async unlockEntryRequest(_, args, context) {
                        return resolve(async () => {
                            return await context.cms.lockingMechanism.unlockEntryRequest({
                                id: args.id,
                                type: args.type
                            });
                        });
                    }
                }
            }
        });

        plugin.name = "headlessCms.graphql.schema.locking";

        context.plugins.register(plugin);
    });

    contextPlugin.name = "headlessCms.graphql.schema.locking.contextWrap";

    return contextPlugin;
};
