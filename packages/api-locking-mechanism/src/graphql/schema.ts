import { resolve } from "~/utils/resolve";
import { ContextPlugin } from "@webiny/handler";
import { Context } from "~/types";
import { createGraphQLSchemaPlugin, NotFoundError } from "@webiny/handler-graphql";

export const createGraphQLSchema = (): ContextPlugin<Context> => {
    const contextPlugin = new ContextPlugin<Context>(async context => {
        const plugin = createGraphQLSchemaPlugin<Context>({
            typeDefs: /* GraphQL */ `
                enum LockingMechanismRecordActionType {
                    requested
                    approved
                    denied
                }

                type LockingMechanismRecordAction {
                    id: ID!
                    type: LockingMechanismRecordActionType!
                    message: String
                    createdBy: CmsIdentity!
                    createdOn: DateTime!
                }

                type LockingMechanismRecord {
                    id: ID!
                    targetId: String!
                    type: String!
                    lockedBy: CmsIdentity!
                    lockedOn: DateTime!
                    actions: [LockingMechanismRecordAction!]
                }

                type LockingMechanismIsEntryLockedResponse {
                    data: Boolean
                    error: CmsError
                }

                type LockingMechanismLockRecordResponse {
                    data: LockingMechanismRecord
                    error: CmsError
                }

                type LockingMechanismLockEntryResponse {
                    data: LockingMechanismRecord
                    error: CmsError
                }

                type LockingMechanismUnlockEntryResponse {
                    data: LockingMechanismRecord
                    error: CmsError
                }

                type LockingMechanismUnlockEntryRequestResponse {
                    data: LockingMechanismRecord
                    error: CmsError
                }

                type LockingMechanismQuery {
                    _empty: String
                }

                type LockingMechanismMutation {
                    _empty: String
                }

                extend type LockingMechanismQuery {
                    isEntryLocked(id: ID!, type: String!): LockingMechanismIsEntryLockedResponse!
                    getLockRecord(id: ID!): LockingMechanismLockRecordResponse!
                }

                extend type LockingMechanismMutation {
                    lockEntry(id: ID!, type: String!): LockingMechanismLockEntryResponse!
                    unlockEntry(id: ID!, type: String!): LockingMechanismUnlockEntryResponse!
                    unlockEntryRequest(
                        id: ID!
                        type: String!
                    ): LockingMechanismUnlockEntryRequestResponse!
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
                            return context.lockingMechanism.isEntryLocked({
                                id: args.id,
                                type: args.type
                            });
                        });
                    },
                    async getLockRecord(_, args, context) {
                        return resolve(async () => {
                            const result = await context.lockingMechanism.getLockRecord(args.id);
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
                            return context.lockingMechanism.lockEntry({
                                id: args.id,
                                type: args.type
                            });
                        });
                    },
                    async unlockEntry(_, args, context) {
                        return resolve(async () => {
                            return await context.lockingMechanism.unlockEntry({
                                id: args.id,
                                type: args.type
                            });
                        });
                    },
                    async unlockEntryRequest(_, args, context) {
                        return resolve(async () => {
                            return await context.lockingMechanism.unlockEntryRequest({
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
