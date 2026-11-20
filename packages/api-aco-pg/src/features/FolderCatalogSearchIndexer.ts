import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { SearchIndexer } from "@webiny/api-headless-cms-pg/features/search/abstractions.js";
import { FOLDER_MODEL_ID } from "@webiny/api-aco/domain/folder/folder.model.js";
import { FolderCatalog } from "~/catalog/FolderCatalog.js";

/**
 * Every pg entry write rebuilds the written entries' search rows inside its transaction.
 * For folder entries, the folder catalog follows in that same transaction, so permissions and paths
 * are never behind the folders.
 */
class FolderCatalogSearchIndexerImpl implements SearchIndexer.Interface {
    public constructor(
        private readonly catalog: FolderCatalog.Interface,
        private readonly decoratee: SearchIndexer.Interface
    ) {}

    public async syncEntries(
        db: Knex.Transaction,
        model: CmsModel,
        entryIds: string[]
    ): Promise<void> {
        await this.decoratee.syncEntries(db, model, entryIds);
        if (model.modelId !== FOLDER_MODEL_ID) {
            return;
        }
        const patched = await this.catalog.sync(db, model, entryIds);
        // Folders whose `path` the catalog rewrote (a moved or renamed subtree).
        if (patched.length > 0) {
            await this.decoratee.syncEntries(db, model, patched);
        }
    }

    public reindexEntries(
        model: CmsModel,
        params: SearchIndexer.ReindexParams
    ): Promise<SearchIndexer.ReindexResult> {
        return this.decoratee.reindexEntries(model, params);
    }
}

export const FolderCatalogSearchIndexer = SearchIndexer.createDecorator({
    decorator: FolderCatalogSearchIndexerImpl,
    dependencies: [FolderCatalog]
});
