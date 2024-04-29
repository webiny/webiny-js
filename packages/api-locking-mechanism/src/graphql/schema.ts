import { resolve, resolveList } from "~/utils/resolve";
import { Context } from "~/types";
import {
    createGraphQLSchemaPlugin,
    IGraphQLSchemaPlugin,
    NotFoundError
} from "@webiny/handler-graphql";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";

interface Params {
    context: Pick<Context, "plugins" | "lockingMechanism" | "security" | "cms">;
}
export const createGraphQLSchema = async (
    params: Params
): Promise<IGraphQLSchemaPlugin<Context>> => {
    const context = params.context;

    const model = await context.lockingMechanism.getModel();

    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => {
            if (model.fields.length === 0) {
                return false;
            } else if (model.isPrivate) {
                return false;
            }
            return true;
        });
    });

    const fieldTypePlugins = createFieldTypePluginRecords(context.plugins);

    const lockingMechanismFields = renderFields({
        models,
        model,
        fields: model.fields,
        type: "manage",
        fieldTypePlugins
    });

    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
        fieldTypePlugins,
        excludeFields: ["entryId"]
    });

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldTypePlugins,
        sorterPlugins: []
    });

    const plugin = createGraphQLSchemaPlugin<Context>({
        typeDefs: /* GraphQL */ `
            ${lockingMechanismFields.map(f => f.typeDefs).join("\n")}

            type LockingMechanismError {
                message: String
                code: String
                data: JSON
                stack: String
            }

            enum LockingMechanismRecordActionType {
                requested
                approved
                denied
            }

            type LockingMechanismIdentity {
                id: String!
                displayName: String
                type: String
            }

            type LockingMechanismRecordAction {
                id: ID!
                type: LockingMechanismRecordActionType!
                message: String
                createdBy: LockingMechanismIdentity!
                createdOn: DateTime!
            }

            type LockingMechanismRecord {
                id: ID!
                lockedBy: LockingMechanismIdentity!
                lockedOn: DateTime!
                updatedOn: DateTime!
                expiresOn: DateTime!
                ${lockingMechanismFields.map(f => f.fields).join("\n")}
            }

            type LockingMechanismIsEntryLockedResponse {
                data: Boolean
                error: LockingMechanismError
            }

            type LockingMechanismGetLockRecordResponse {
                data: LockingMechanismRecord
                error: LockingMechanismError
            }

            type LockingMechanismGetLockedEntryLockRecordResponse {
                data: LockingMechanismRecord
                error: LockingMechanismError
            }

            type LockingMechanismListLockRecordsResponse {
                data: [LockingMechanismRecord!]
                error: LockingMechanismError
            }

            type LockingMechanismLockEntryResponse {
                data: LockingMechanismRecord
                error: LockingMechanismError
            }
            
            type LockingMechanismUpdateLockResponse {
                data: LockingMechanismRecord
                error: LockingMechanismError
            }

            type LockingMechanismUnlockEntryResponse {
                data: LockingMechanismRecord
                error: LockingMechanismError
            }

            type LockingMechanismUnlockEntryRequestResponse {
                data: LockingMechanismRecord
                error: LockingMechanismError
            }

            input LockingMechanismListWhereInput {
                ${listFilterFieldsRender}
            }

            enum LockingMechanismListSorter {
                ${sortEnumRender}
            }

            type LockingMechanismQuery {
                _empty: String
            }

            type LockingMechanismMutation {
                _empty: String
            }

            extend type LockingMechanismQuery {
                isEntryLocked(id: ID!, type: String!): LockingMechanismIsEntryLockedResponse!
                getLockRecord(id: ID!, type: String!): LockingMechanismGetLockRecordResponse!
                # Returns lock record or null - if entry is locked in context of the current user, does not throw an error like getLockRecord if no record in the DB
                getLockedEntryLockRecord(id: ID!, type: String!): LockingMechanismGetLockedEntryLockRecordResponse!
                listAllLockRecords(
                    where: LockingMechanismListWhereInput
                    sort: [LockingMechanismListSorter!]
                    limit: Int
                    after: String
                ): LockingMechanismListLockRecordsResponse!
                # Basically same as listAllLockRecords except this one will filter out records with expired lock.
                listLockRecords(
                    where: LockingMechanismListWhereInput
                    sort: [LockingMechanismListSorter!]
                    limit: Int
                    after: String
                ): LockingMechanismListLockRecordsResponse!
            }

            extend type LockingMechanismMutation {
                lockEntry(id: ID!, type: String!): LockingMechanismLockEntryResponse!
                updateEntryLock(id: ID!, type: String!): LockingMechanismUpdateLockResponse!
                unlockEntry(id: ID!, type: String!, force: Boolean): LockingMechanismUnlockEntryResponse!
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
                        const result = await context.lockingMechanism.getLockRecord({
                            id: args.id,
                            type: args.type
                        });
                        if (result) {
                            return result;
                        }
                        throw new NotFoundError("Lock record not found.");
                    });
                },
                async getLockedEntryLockRecord(_, args, context) {
                    return resolve(async () => {
                        return await context.lockingMechanism.getLockedEntryLockRecord({
                            id: args.id,
                            type: args.type
                        });
                    });
                },

                async listLockRecords(_, args, context) {
                    return resolveList(async () => {
                        return await context.lockingMechanism.listLockRecords(args);
                    });
                },
                listAllLockRecords(_, args, context) {
                    return resolveList(async () => {
                        return await context.lockingMechanism.listAllLockRecords(args);
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
                async updateEntryLock(_, args, context) {
                    return resolve(async () => {
                        return context.lockingMechanism.updateEntryLock({
                            id: args.id,
                            type: args.type
                        });
                    });
                },
                async unlockEntry(_, args, context) {
                    return resolve(async () => {
                        return await context.lockingMechanism.unlockEntry({
                            id: args.id,
                            type: args.type,
                            force: args.force
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

    plugin.name = "lockingMechanism.graphql.schema.locking";

    return plugin;
};
