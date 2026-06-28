import { createFeature } from "@webiny/feature/api";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { HeadlessCms } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createAcoGraphQL } from "./createAcoGraphQL.js";
import { AcoInitializer } from "./AcoInitializer.js";
import { CreateFlpTask } from "~/flp/tasks/createFlp.task.js";
import { UpdateFlpTask } from "~/flp/tasks/updateFlp.task.js";
import { DeleteFlpTask } from "~/flp/tasks/deleteFlp.task.js";
import { SyncFlpTask } from "~/flp/tasks/syncFlp.task.js";
import type { AcoStorageOperations } from "~/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { FolderModel } from "~/domain/folder/folder.model.js";
import { FilterPrivateModel } from "~/filter/filter.model.js";
// Facade wiring (moved here from createAcoContext so the ACO facade can be a lazy DI factory).
import { createFilterOperations } from "~/filter/filter.so.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
import { createFlpCrudMethods } from "~/flp/index.js";
import {
    FolderLevelPermissions,
    FolderLevelPermissionsFeature
} from "~/features/flp/FolderLevelPermissions/index.js";
import { UpdateFolderFeature } from "~/features/folder/UpdateFolder/index.js";
import { DeleteFolderFeature } from "~/features/folder/DeleteFolder/index.js";
import { CreateFolderFeature } from "~/features/folder/CreateFolder/index.js";
import { GetFolderFeature } from "~/features/folder/GetFolder/index.js";
import { ListFoldersFeature } from "~/features/folder/ListFolders/index.js";
import { GetFolderHierarchyFeature } from "~/features/folder/GetFolderHierarchy/index.js";
import { GetAncestorsFeature } from "~/features/folder/GetAncestors/index.js";
import { UpdateFlpOnFolderUpdatedFeature } from "~/features/flp/UpdateFlpOnFolderUpdated/index.js";
import { DeleteFlpOnFolderDeletedFeature } from "~/features/flp/DeleteFlpOnFolderDeleted/index.js";
import { EnsureHcmsFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureHcmsFolderIsEmptyOnDelete/index.js";
import { CreateFlpFeature } from "~/features/flp/CreateFlp/index.js";
import { DeleteFlpFeature } from "~/features/flp/DeleteFlp/index.js";
import { UpdateFlpFeature } from "~/features/flp/UpdateFlp/index.js";
import { EnsureFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureFolderIsEmptyOnDelete/index.js";
import {
    AcoFilterCrud,
    AcoFlpCrud,
    FilterStorageOperations,
    FlpStorageOperations
} from "~/features/folder/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folder/ListFolderLevelPermissionsTargets/feature.js";
import { CreateFlpOnFolderCreatedFeature } from "~/features/flp/CreateFlpOnFolderCreated/index.js";
import { EnsureFolderIsEmptyFeature } from "~/features/folder/EnsureFolderIsEmpty/feature.js";

class AcoSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        // createAcoGraphQL() returns [baseSchema, folderSchema, filterSchema].
        // baseSchema and filterSchema are static GraphQLSchemaPlugins — register them here.
        // folderSchema is a ContextPlugin that needs the folder model; it is applied by AcoInitializer.
        const [baseSchema, , filterSchema] =
            createAcoGraphQL() as unknown as IGraphQLSchemaPlugin[];

        for (const plugin of [baseSchema, filterSchema]) {
            const schema = (plugin as IGraphQLSchemaPlugin).schema;

            if (schema.typeDefs) {
                builder.addTypeDefs(schema.typeDefs);
            }

            if (schema.resolvers) {
                builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
            }
        }

        return builder;
    }
}

const AcoSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: AcoSchemaFactoryImpl,
    dependencies: []
});

export const AcoFeature = createFeature({
    name: "Aco",
    register(container: Container) {
        container.register(FolderModel);
        container.register(FilterPrivateModel);

        // Background task definitions — pure wiring, no tenant/identity needed.
        container.register(CreateFlpTask);
        container.register(UpdateFlpTask);
        container.register(DeleteFlpTask);
        container.register(SyncFlpTask);

        // Folder + FLP use-case features — pure DI wiring (all lazy). Moved out of the per-request
        // initializer so they're registered for every event, not only GraphQL requests.
        FolderLevelPermissionsFeature.register(container);
        CreateFolderFeature.register(container);
        UpdateFolderFeature.register(container);
        DeleteFolderFeature.register(container);
        GetFolderFeature.register(container);
        ListFoldersFeature.register(container);
        ListFolderLevelPermissionsTargetsFeature.register(container);
        GetFolderHierarchyFeature.register(container);
        GetAncestorsFeature.register(container);
        EnsureFolderIsEmptyFeature.register(container);
        CreateFlpFeature.register(container);
        UpdateFlpFeature.register(container);
        DeleteFlpFeature.register(container);
        ListFlpsFeature.register(container);
        GetFlpFeature.register(container);
        CreateFlpOnFolderCreatedFeature.register(container);
        UpdateFlpOnFolderUpdatedFeature.register(container);
        DeleteFlpOnFolderDeletedFeature.register(container);
        EnsureFolderIsEmptyOnDeleteFeature.register(container);
        EnsureHcmsFolderIsEmptyOnDeleteFeature.register(container);

        // ===== Lazy ACO facade =====
        // Built on first resolve (post-auth) so the HeadlessCms facade (also lazy) is resolved on
        // demand. Memoised per request container. Consumers resolve AcoFlpCrud / AcoFilterCrud /
        // FilterStorageOperations via DI.
        const getTenant = (): Tenant => container.resolve(TenantContext).getTenant();

        let storageOperations: AcoStorageOperations | undefined;
        const getStorageOperations = (): AcoStorageOperations => {
            if (!storageOperations) {
                const cms = container.resolve(HeadlessCms);
                const identityContext = container.resolve(IdentityContext);
                storageOperations = {
                    filter: createFilterOperations({ cms, identityContext, container }),
                    flp: container.resolve(FlpStorageOperations)
                };
            }
            return storageOperations;
        };

        let flpCrudMethods: ReturnType<typeof createFlpCrudMethods> | undefined;
        const getFlpCrudMethods = () => {
            if (!flpCrudMethods) {
                flpCrudMethods = createFlpCrudMethods({
                    getTenant,
                    storageOperations: getStorageOperations()
                });
            }
            return flpCrudMethods;
        };
        container.registerFactory(AcoFlpCrud, () => getFlpCrudMethods());
        container.registerFactory(FilterStorageOperations, () => getStorageOperations().filter);

        let filterCrudMethods: ReturnType<typeof createFilterCrudMethods> | undefined;
        container.registerFactory(AcoFilterCrud, () => {
            if (!filterCrudMethods) {
                filterCrudMethods = createFilterCrudMethods({
                    container,
                    getTenant,
                    storageOperations: getStorageOperations(),
                    folderLevelPermissions: container.resolve(FolderLevelPermissions)
                });
            }
            return filterCrudMethods;
        });

        container.register(AcoInitializer);
        container.register(AcoSchemaFactory);
    }
});
