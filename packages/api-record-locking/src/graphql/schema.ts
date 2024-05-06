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
import { checkPermissions } from "~/utils/checkPermissions";

interface Params {
    context: Pick<Context, "plugins" | "recordLocking" | "security" | "cms">;
}
export const createGraphQLSchema = async (
    params: Params
): Promise<IGraphQLSchemaPlugin<Context>> => {
    const context = params.context;

    const model = await context.recordLocking.getModel();

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

    const recordLockingFields = renderFields({
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
            ${recordLockingFields.map(f => f.typeDefs).join("\n")}

            type RecordLockingError {
                message: String
                code: String
                data: JSON
                stack: String
            }

            enum RecordLockingRecordActionType {
                requested
                approved
                denied
            }

            type RecordLockingIdentity {
                id: String!
                displayName: String
                type: String
            }

            type RecordLockingRecordAction {
                id: ID!
                type: RecordLockingRecordActionType!
                message: String
                createdBy: RecordLockingIdentity!
                createdOn: DateTime!
            }

            type RecordLockingRecord {
                id: ID!
                lockedBy: RecordLockingIdentity!
                lockedOn: DateTime!
                updatedOn: DateTime!
                expiresOn: DateTime!
                ${recordLockingFields.map(f => f.fields).join("\n")}
            }

            type RecordLockingIsEntryLockedResponse {
                data: Boolean
                error: RecordLockingError
            }

            type RecordLockingGetLockRecordResponse {
                data: RecordLockingRecord
                error: RecordLockingError
            }

            type RecordLockingGetLockedEntryLockRecordResponse {
                data: RecordLockingRecord
                error: RecordLockingError
            }

            type RecordLockingListLockRecordsResponse {
                data: [RecordLockingRecord!]
                error: RecordLockingError
            }

            type RecordLockingLockEntryResponse {
                data: RecordLockingRecord
                error: RecordLockingError
            }
            
            type RecordLockingUpdateLockResponse {
                data: RecordLockingRecord
                error: RecordLockingError
            }

            type RecordLockingUnlockEntryResponse {
                data: RecordLockingRecord
                error: RecordLockingError
            }

            type RecordLockingUnlockEntryRequestResponse {
                data: RecordLockingRecord
                error: RecordLockingError
            }

            input RecordLockingListWhereInput {
                ${listFilterFieldsRender}
            }

            enum RecordLockingListSorter {
                ${sortEnumRender}
            }

            type RecordLockingQuery {
                _empty: String
            }

            type RecordLockingMutation {
                _empty: String
            }

            extend type RecordLockingQuery {
                isEntryLocked(id: ID!, type: String!): RecordLockingIsEntryLockedResponse!
                getLockRecord(id: ID!, type: String!): RecordLockingGetLockRecordResponse!
                # Returns lock record or null - if entry is locked in context of the current user, does not throw an error like getLockRecord if no record in the DB
                getLockedEntryLockRecord(id: ID!, type: String!): RecordLockingGetLockedEntryLockRecordResponse!
                listAllLockRecords(
                    where: RecordLockingListWhereInput
                    sort: [RecordLockingListSorter!]
                    limit: Int
                    after: String
                ): RecordLockingListLockRecordsResponse!
                # Basically same as listAllLockRecords except this one will filter out records with expired lock.
                listLockRecords(
                    where: RecordLockingListWhereInput
                    sort: [RecordLockingListSorter!]
                    limit: Int
                    after: String
                ): RecordLockingListLockRecordsResponse!
            }

            extend type RecordLockingMutation {
                lockEntry(id: ID!, type: String!): RecordLockingLockEntryResponse!
                updateEntryLock(id: ID!, type: String!): RecordLockingUpdateLockResponse!
                unlockEntry(id: ID!, type: String!, force: Boolean): RecordLockingUnlockEntryResponse!
                unlockEntryRequest(
                    id: ID!
                    type: String!
                ): RecordLockingUnlockEntryRequestResponse!
            }

            extend type Query {
                recordLocking: RecordLockingQuery
            }

            extend type Mutation {
                recordLocking: RecordLockingMutation
            }
        `,
        resolvers: {
            Query: {
                recordLocking: async () => ({})
            },
            Mutation: {
                recordLocking: async () => ({})
            },
            RecordLockingQuery: {
                async isEntryLocked(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        return context.recordLocking.isEntryLocked({
                            id: args.id,
                            type: args.type
                        });
                    });
                },
                async getLockRecord(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const result = await context.recordLocking.getLockRecord({
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
                        await checkPermissions(context);
                        return await context.recordLocking.getLockedEntryLockRecord({
                            id: args.id,
                            type: args.type
                        });
                    });
                },

                async listLockRecords(_, args, context) {
                    return resolveList(async () => {
                        await checkPermissions(context);
                        return await context.recordLocking.listLockRecords(args);
                    });
                },
                listAllLockRecords(_, args, context) {
                    return resolveList(async () => {
                        await checkPermissions(context);
                        return await context.recordLocking.listAllLockRecords(args);
                    });
                }
            },
            RecordLockingMutation: {
                async lockEntry(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        return context.recordLocking.lockEntry({
                            id: args.id,
                            type: args.type
                        });
                    });
                },
                async updateEntryLock(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        return context.recordLocking.updateEntryLock({
                            id: args.id,
                            type: args.type
                        });
                    });
                },
                async unlockEntry(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        return await context.recordLocking.unlockEntry({
                            id: args.id,
                            type: args.type,
                            force: args.force
                        });
                    });
                },
                async unlockEntryRequest(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        return await context.recordLocking.unlockEntryRequest({
                            id: args.id,
                            type: args.type
                        });
                    });
                }
            }
        }
    });

    plugin.name = "recordLocking.graphql.schema.locking";

    return plugin;
};
