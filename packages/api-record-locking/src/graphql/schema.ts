import { resolve, resolveList } from "./resolve.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import { checkPermissions } from "./checkPermissions.js";
import { IsEntryLockedUseCase } from "~/features/IsEntryLocked/abstractions.js";
import { GetLockRecordUseCase } from "~/features/GetLockRecord/abstractions.js";
import { GetLockedEntryLockRecordUseCase } from "~/features/GetLockedEntryLockRecord/abstractions.js";
import { ListLockRecordsUseCase } from "~/features/ListLockRecords/abstractions.js";
import { ListAllLockRecordsUseCase } from "~/features/ListAllLockRecords/abstractions.js";
import { LockEntryUseCase } from "~/features/LockEntry/abstractions.js";
import { UpdateEntryLockUseCase } from "~/features/UpdateEntryLock/abstractions.js";
import { UnlockEntryUseCase } from "~/features/UnlockEntry/abstractions.js";
import { UnlockEntryRequestUseCase } from "~/features/UnlockEntryRequest/abstractions.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import type { CmsFieldTypePlugins } from "@webiny/api-headless-cms/types/index.js";

interface Params {
    // Record locking model
    model: CmsModel;
    // All public models
    models: CmsModel[];
    fieldTypePlugins: CmsFieldTypePlugins;
}
export const createGraphQLSchema = async (
    params: Params
): Promise<IGraphQLSchemaPlugin<ApiCoreContext>> => {
    // Record locking model
    const model = params.model;

    // Other public models that have at least one field
    const models = params.models.filter(model => {
        return model.fields.length > 0;
    });

    const fieldTypePlugins = params.fieldTypePlugins;

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

    const plugin = createGraphQLSchemaPlugin<ApiCoreContext>({
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
                ${listFilterFieldsRender.allFiltersAsString()}
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
                        const useCase = context.container.resolve(IsEntryLockedUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                async getLockRecord(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(GetLockRecordUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                async getLockedEntryLockRecord(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(GetLockedEntryLockRecordUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type
                        });
                        // Returns null if not found/expired/locked by current user
                        if (result.isFail()) {
                            return null;
                        }
                        return result.value;
                    });
                },

                async listLockRecords(_, args, context) {
                    return resolveList(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(ListLockRecordsUseCase);
                        const result = await useCase.execute(args);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                listAllLockRecords(_, args, context) {
                    return resolveList(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(ListAllLockRecordsUseCase);
                        const result = await useCase.execute(args);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                }
            },
            RecordLockingMutation: {
                async lockEntry(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(LockEntryUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                async updateEntryLock(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(UpdateEntryLockUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                async unlockEntry(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(UnlockEntryUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type,
                            force: args.force
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                },
                async unlockEntryRequest(_, args, context) {
                    return resolve(async () => {
                        await checkPermissions(context);
                        const useCase = context.container.resolve(UnlockEntryRequestUseCase);
                        const result = await useCase.execute({
                            id: args.id,
                            type: args.type
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                }
            }
        }
    });

    plugin.name = "recordLocking.graphql.schema.locking";

    return plugin;
};
