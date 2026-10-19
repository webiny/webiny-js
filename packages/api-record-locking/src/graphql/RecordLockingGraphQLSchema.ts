import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { createModelSchemaKey } from "@webiny/api-headless-cms/utils/createModelSchemaKey.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import { RecordLockingModelProvider } from "~/domain/abstractions.js";
import { IsEntryLockedUseCase } from "~/features/IsEntryLocked/abstractions.js";
import { GetLockRecordUseCase } from "~/features/GetLockRecord/abstractions.js";
import { GetLockedEntryLockRecordUseCase } from "~/features/GetLockedEntryLockRecord/abstractions.js";
import { ListLockRecordsUseCase } from "~/features/ListLockRecords/abstractions.js";
import type { ListLockRecordsInput } from "~/features/ListLockRecords/abstractions.js";
import { ListAllLockRecordsUseCase } from "~/features/ListAllLockRecords/abstractions.js";
import type { ListAllLockRecordsInput } from "~/features/ListAllLockRecords/abstractions.js";
import { LockEntryUseCase } from "~/features/LockEntry/abstractions.js";
import { UpdateEntryLockUseCase } from "~/features/UpdateEntryLock/abstractions.js";
import { UnlockEntryUseCase } from "~/features/UnlockEntry/abstractions.js";
import { UnlockEntryRequestUseCase } from "~/features/UnlockEntryRequest/abstractions.js";
import { resolve } from "./resolve.js";
import { resolveList } from "./resolve.js";
import { checkPermissions } from "./checkPermissions.js";

interface IEntryArgs {
    id: string;
    type: string;
}

interface IUnlockEntryArgs extends IEntryArgs {
    force?: boolean;
}

interface IResolverParams<TArgs = unknown> {
    args: TArgs;
}

interface IRenderTypeDefsParams {
    model: CmsModel;
    models: CmsModel[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

function renderTypeDefs(params: IRenderTypeDefsParams): string {
    const { model, fieldRegistry } = params;

    const models = params.models.filter(model => {
        return model.fields.length > 0;
    });

    const recordLockingFields = renderFields({
        models,
        model,
        fields: model.fields,
        type: "manage",
        fieldRegistry
    });

    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
        fieldRegistry,
        excludeFields: ["entryId"]
    });

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldRegistry,
        sorters: []
    });

    return /* GraphQL */ `
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
    `;
}

function addQueryResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
    builder.addResolver({
        path: "Query.recordLocking",
        resolver: () => async () => ({})
    });

    builder.addResolver({
        path: "RecordLockingQuery.isEntryLocked",
        dependencies: [IdentityContext, IsEntryLockedUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: IsEntryLockedUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute({
                        id: args.id,
                        type: args.type
                    });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingQuery.getLockRecord",
        dependencies: [IdentityContext, GetLockRecordUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: GetLockRecordUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute({
                        id: args.id,
                        type: args.type
                    });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingQuery.getLockedEntryLockRecord",
        dependencies: [IdentityContext, GetLockedEntryLockRecordUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: GetLockedEntryLockRecordUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute({
                        id: args.id,
                        type: args.type
                    });
                    // Returns null if not found/expired/locked by current user.
                    if (result.isFail()) {
                        return null;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingQuery.listLockRecords",
        dependencies: [IdentityContext, ListLockRecordsUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: ListLockRecordsUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<ListLockRecordsInput>) => {
                return resolveList(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute(args);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingQuery.listAllLockRecords",
        dependencies: [IdentityContext, ListAllLockRecordsUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: ListAllLockRecordsUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<ListAllLockRecordsInput>) => {
                return resolveList(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute(args);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });
}

function addMutationResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
    builder.addResolver({
        path: "Mutation.recordLocking",
        resolver: () => async () => ({})
    });

    builder.addResolver({
        path: "RecordLockingMutation.lockEntry",
        dependencies: [IdentityContext, LockEntryUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: LockEntryUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute({
                        id: args.id,
                        type: args.type
                    });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingMutation.updateEntryLock",
        dependencies: [IdentityContext, UpdateEntryLockUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: UpdateEntryLockUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute({
                        id: args.id,
                        type: args.type
                    });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingMutation.unlockEntry",
        dependencies: [IdentityContext, UnlockEntryUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: UnlockEntryUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IUnlockEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
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
            };
        }
    });

    builder.addResolver({
        path: "RecordLockingMutation.unlockEntryRequest",
        dependencies: [IdentityContext, UnlockEntryRequestUseCase],
        resolver: (
            identityContext: IdentityContext.Interface,
            useCase: UnlockEntryRequestUseCase.Interface
        ) => {
            return ({ args }: IResolverParams<IEntryArgs>) => {
                return resolve(async () => {
                    checkPermissions(identityContext);
                    const result = await useCase.execute({
                        id: args.id,
                        type: args.type
                    });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });
}

/**
 * The record locking GraphQL schema. The lock record type is rendered from the lock record model,
 * which is loaded when the schema is composed.
 */
class RecordLockingGraphQLSchemaImpl implements GraphQLSchemaFactory.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly modelProvider: RecordLockingModelProvider.Interface,
        private readonly listModelsUseCase: ListModelsUseCase.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface
    ) {}

    public async getSchemaKey(): Promise<string> {
        const inputs = await this.loadInputs();
        if (!inputs) {
            return "RecordLocking:no-tenant";
        }

        const modelKey = createModelSchemaKey([inputs.model], inputs.models);
        return `RecordLocking:${modelKey}`;
    }

    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        const inputs = await this.loadInputs();
        if (!inputs) {
            return builder;
        }

        const { model, models } = inputs;
        const typeDefs = renderTypeDefs({
            model,
            models,
            fieldRegistry: this.fieldRegistry
        });

        builder.addTypeDefs(typeDefs);
        addQueryResolvers(builder);
        addMutationResolvers(builder);

        return builder;
    }

    private async loadInputs() {
        // There is no tenant until installation completes, and no model to render a schema from.
        if (!this.tenantContext.getTenant()) {
            return null;
        }

        const model = await this.modelProvider.get();

        // The model list feeds `ref` field rendering. ListModels is filtered by permission, so it
        // is read without authorization to keep the schema the same for every identity.
        const models = await this.identityContext.withoutAuthorization(async () => {
            const result = await this.listModelsUseCase.execute({ includePrivate: false });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        });

        return { model, models };
    }
}

export const RecordLockingGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: RecordLockingGraphQLSchemaImpl,
    dependencies: [
        TenantContext,
        IdentityContext,
        RecordLockingModelProvider,
        ListModelsUseCase,
        CmsModelFieldToGraphQLRegistry
    ]
});
