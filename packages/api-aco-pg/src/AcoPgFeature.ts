import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { FolderCatalogSchemaImplementation } from "~/catalog/FolderCatalogSchema.js";
import { FolderCatalogImplementation } from "~/catalog/FolderCatalog.js";
import { FolderCatalogSearchIndexer } from "~/features/FolderCatalogSearchIndexer.js";
import { PgFolderPermissionsRepository } from "~/features/PgFolderPermissionsRepository.js";
import { PgFolderCatalogSync } from "~/features/PgFolderCatalogSync.js";
import { ReadOnlyAcoFlpCrud } from "~/features/ReadOnlyAcoFlpCrud.js";
import { PgFolderAccessListFilter } from "~/features/PgFolderAccessListFilter.js";
import { PgUserFolderCandidates } from "~/features/PgUserFolderCandidates.js";

/**
 * Folder-level permissions on the Postgres-native CMS storage. Folder entries stay the source of
 * truth; a folder catalog (tree by ids and slugs, plus each folder's own grants) follows them in
 * the same transaction, so permissions and descendant paths are never behind. Inherited
 * permissions are worked out when reading.
 *
 * Register next to `HeadlessCmsPgFeature`, instead of `TaskCatalogFlpFeature`.
 */
export const AcoPgFeature = createFeature({
    name: "Aco/Pg",
    register(container: Container) {
        // Remembers that the tables exist and which tenants are built, so it lives for the process.
        container.register(FolderCatalogSchemaImplementation).inSingletonScope();
        container.register(FolderCatalogImplementation);
        container.registerDecorator(FolderCatalogSearchIndexer);

        container.register(PgFolderPermissionsRepository);
        container.register(PgFolderCatalogSync);
        container.register(PgFolderAccessListFilter);
        container.register(ReadOnlyAcoFlpCrud);
        // A decorator, so it applies whichever order the features are registered in.
        container.registerDecorator(PgUserFolderCandidates);
    }
});
