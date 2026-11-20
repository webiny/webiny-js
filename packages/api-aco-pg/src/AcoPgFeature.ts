import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { FolderCatalogSchemaImplementation } from "~/catalog/FolderCatalogSchema.js";
import { AcoPgSchemaSetup } from "~/catalog/AcoPgSchemaSetup.js";
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
 * Register next to `HeadlessCmsPgFeature`, instead of `TaskCatalogFlpFeature`, in each request's
 * container (`<AcoPg />` adds it with the project's extensions). What it keeps for the process
 * (which tables exist, which tenants are built) lives in a process-wide memory. It also registers
 * its `aco` schema setup step.
 */
export const AcoPgFeature = createFeature({
    name: "Aco/Pg",
    register(container: Container) {
        container.register(FolderCatalogSchemaImplementation).inSingletonScope();
        // The `aco` schema setup step: the catalog's tables.
        container.register(AcoPgSchemaSetup);
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
