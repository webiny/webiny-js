import { createFeature } from "@webiny/feature/api";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { addAcoBaseSchema } from "./createAcoGraphQL.js";
import { addFilterSchema } from "~/filter/filter.gql.js";
import { AcoFolderSchemaFactory } from "./AcoFolderSchemaFactory.js";
import { FolderModelProvider } from "~/features/folder/FolderModelProvider.js";
import { CmsFlpFeature } from "~/features/cms/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import type { AcoStorageOperations } from "~/types.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { FolderModel } from "~/domain/folder/folder.model.js";
import { FilterPrivateModel } from "~/filter/filter.model.js";
// Facade wiring (moved here from createAcoContext so the ACO facade can be a lazy DI factory).
import { createFilterOperations } from "~/filter/filter.so.js";
import { createFilterCrudMethods } from "~/filter/filter.crud.js";
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
import { EnsureHcmsFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureHcmsFolderIsEmptyOnDelete/index.js";
import { EnsureFolderIsEmptyOnDeleteFeature } from "~/features/folder/EnsureFolderIsEmptyOnDelete/index.js";
import { AcoFilterCrud, FilterStorageOperations } from "~/features/folder/shared/abstractions.js";
import { ListFlpsFeature } from "~/features/flp/ListFlps/feature.js";
import { GetFlpFeature } from "~/features/flp/GetFlp/feature.js";
import { CodeFlpsFeature } from "~/features/flp/shared/feature.js";
import { ListFolderLevelPermissionsTargetsFeature } from "~/features/folder/ListFolderLevelPermissionsTargets/feature.js";
import { FolderCatalogSyncHandlersFeature } from "~/features/flp/FolderCatalogSync/index.js";
import { ListFolderAccessFeature } from "~/features/flp/ListFolderAccess/index.js";
import { EnsureFolderIsEmptyFeature } from "~/features/folder/EnsureFolderIsEmpty/feature.js";
import { AcoAiToolsFeature } from "~/features/ai/index.js";
import { NotifyFolderChangeFeature } from "~/features/folder/NotifyFolderChange/index.js";
import { NotifyTeamChangeFeature } from "~/features/team/NotifyTeamChange/index.js";
import { NotifyRoleChangeFeature } from "~/features/role/NotifyRoleChange/index.js";

class AcoSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-aco/AcoSchemaFactoryImpl");

    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        // Static ACO base + filter schema (DI-native contributors declaring their deps). The
        // dynamic, per-tenant folder schema is built by AcoFolderSchemaFactory.
        addAcoBaseSchema(builder);
        addFilterSchema(builder);
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
        AcoAiToolsFeature.register(container);
        container.register(FilterPrivateModel);

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
        ListFlpsFeature.register(container);
        GetFlpFeature.register(container);
        ListFolderAccessFeature.register(container);
        // Must come after ListFlps/GetFlp — it decorates both.
        CodeFlpsFeature.register(container);
        // Folder changes go to FolderCatalogSync. Its implementation, like those of
        // FolderPermissionsRepository and FolderAccessListFilter, comes from the storage's FLP
        // strategy (e.g. TaskCatalogFlpFeature), not from here.
        FolderCatalogSyncHandlersFeature.register(container);
        NotifyFolderChangeFeature.register(container);
        NotifyTeamChangeFeature.register(container);
        NotifyRoleChangeFeature.register(container);
        EnsureFolderIsEmptyOnDeleteFeature.register(container);
        EnsureHcmsFolderIsEmptyOnDeleteFeature.register(container);

        // ===== Lazy ACO facade =====
        // Built on first resolve (post-auth), memoised per request container. Consumers resolve
        // AcoFilterCrud / FilterStorageOperations via DI. AcoFlpCrud comes from the FLP strategy.
        const getTenant = (): Tenant => container.resolve(TenantContext).getTenant();

        let storageOperations: Pick<AcoStorageOperations, "filter"> | undefined;
        const getStorageOperations = (): Pick<AcoStorageOperations, "filter"> => {
            if (!storageOperations) {
                const identityContext = container.resolve(IdentityContext);
                storageOperations = {
                    filter: createFilterOperations({ identityContext, container })
                };
            }
            return storageOperations;
        };

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

        // The per-tenant folder model is resolved on demand — see FolderModelProvider.
        container.register(FolderModelProvider);

        // CMS-entry folder-level-permission decorators, feature-flag gated. These must be
        // registered before any CMS-entry abstraction they wrap is first resolved, which is why
        // they used to sit in a pre-resolver initializer. Register time is strictly earlier and the
        // gate is valid here: the WCP license is refreshed before any feature registers (see
        // registerApiRequestStack).
        if (
            container
                .resolve(FeatureFlags)
                .get()
                .isEnabled("advancedAccessControlLayer.folderLevelPermissions")
        ) {
            CmsFlpFeature.register(container);
        }

        container.register(AcoSchemaFactory);
        container.register(AcoFolderSchemaFactory);
    }
});
