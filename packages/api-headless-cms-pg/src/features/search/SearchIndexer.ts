import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ScopeRegistry as ScopeRegistryTypes } from "~/features/scopes/abstractions.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { createStorageTransformCallable } from "@webiny/api-headless-cms-storage";
import { SearchIndexer as Abstraction } from "./abstractions.js";
import type { IReindexEntriesParams, IReindexEntriesResult } from "./abstractions.js";
import { KnexClient } from "@webiny/api-core-sql";
import { PgSchema } from "~/features/schema/abstractions.js";
import { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { buildSearchRow } from "./buildSearchRow.js";
import { SqlFragment } from "./SqlFragment.js";
import { rowToEntry } from "~/features/entries/entryRow.js";
import { buildTsvector } from "./lexemes.js";
import { getView } from "./views.js";
import { MODE_LOCK_SHARED_SQL, writesIx } from "~/features/indexMode/indexMode.js";

const INSERT_BATCH = 200;

class SearchIndexerImpl implements Abstraction.Interface {
    public constructor(
        private readonly schema: PgSchema.Interface,
        private readonly scopes: ScopeRegistry.Interface,
        private readonly storageTransformRegistry: StorageTransformRegistry.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly knex: KnexClient.Interface
    ) {}

    public async syncEntries(
        db: Knex.Transaction,
        model: CmsModel,
        entryIds: string[]
    ): Promise<void> {
        // Only these entries' rows: a model change never rebuilds other rows inside a write
        // (ModelStorageSync does that in the background). These rows get their final shape.
        const scope = await this.scopes.get(model, db);
        return this.rebuild(db, model, scope, entryIds);
    }

    public async reindexEntries(
        model: CmsModel,
        params: IReindexEntriesParams
    ): Promise<IReindexEntriesResult> {
        const { after, limit } = params;
        // Before the transaction, as the write operations do: it may need a connection of its own.
        await this.schema.ensure();
        const { entries } = this.schema.getTables();
        return this.knex.client.transaction(async trx => {
            // Entry ids in order, through the (tenant, model_id, entry_id, version) index.
            const query = trx(entries)
                .distinct("entry_id")
                .where({ tenant: model.tenant, model_id: model.modelId })
                .orderBy("entry_id")
                .limit(limit);
            if (after !== null) {
                query.andWhere("entry_id", ">", after);
            }
            const entryIds: string[] = (await query).map(row => row.entry_id);
            if (entryIds.length > 0) {
                const scope = await this.scopes.get(model, trx);
                await this.rebuild(trx, model, scope, entryIds);
            }
            return {
                indexed: entryIds.length,
                cursor: entryIds.length === limit ? entryIds[entryIds.length - 1] : null
            };
        });
    }

    private async rebuild(
        db: Knex.Transaction,
        model: CmsModel,
        scope: ScopeRegistryTypes.Scope,
        entryIds: string[] | null
    ): Promise<void> {
        const { entries, search, scopes } = this.schema.getTables();
        // Read the mode under the shared mode lock: a mode change waits for this write to commit,
        // so its batch flagging sees these rows, and writes after the change see the new mode.
        await db.raw(MODE_LOCK_SHARED_SQL, [scopes, scope.scopeId]);
        const modeResult = await db.raw(`SELECT index_mode FROM "${scopes}" WHERE scope_id = ?`, [
            scope.scopeId
        ]);
        const ix = writesIx(modeResult.rows[0].index_mode);

        const rowsQuery = db(entries)
            .select("entry_id", "version", "is_latest", "is_published", "data")
            .where({ tenant: model.tenant, model_id: model.modelId })
            .andWhere(q => q.where("is_latest", true).orWhere("is_published", true));
        const deleteQuery = db(search).where("scope_id", scope.scopeId);
        if (entryIds !== null) {
            /*
             * One array parameter, not one per id: whereIn() binds every id separately, which is
             * slow for a large batch (a folder subtree, say) and fails past Postgres's 65,535
             * parameters.
             */
            const ids = SqlFragment.textArray(entryIds);
            rowsQuery.whereRaw(`entry_id = ANY(${ids.sql})`, ids.rawBindings());
            deleteQuery.whereRaw(`entry_id = ANY(${ids.sql})`, ids.rawBindings());
        }

        const allRows = await rowsQuery;
        // One row per entry and flag. Storage-level callers can flag several revisions as latest;
        // the highest version wins, which is what the read paths return too.
        const pick = new Map<string, (typeof allRows)[number]>();
        for (const row of allRows) {
            for (const flag of ["is_latest", "is_published"] as const) {
                if (!row[flag]) {
                    continue;
                }
                const key = `${row.entry_id}:${flag}`;
                const current = pick.get(key);
                if (!current || current.version < row.version) {
                    pick.set(key, row);
                }
            }
        }
        await deleteQuery.delete();

        // Index what the API sees, not what is stored: long-text is compressed in storage, dates are strings.
        const storageModel = this.storageModelProvider.getModel(model);
        const fromStorage = createStorageTransformCallable(
            this.storageTransformRegistry,
            storageModel
        );

        const inserts: Record<string, unknown>[] = [];
        for (const [key, row] of pick) {
            const entry = rowToEntry(row, storageModel);
            for (const field of storageModel.fields) {
                entry.values[field.fieldId] = await fromStorage(field, entry.values[field.fieldId]);
            }
            const deleted = row.data.wbyDeleted === true;
            const views = [getView(key.endsWith(":is_published"), deleted)];
            for (const view of views) {
                const { columns, fullText } = buildSearchRow(scope, view, entry);
                columns.ix = ix;
                columns.tsv = db.raw("?::tsvector", [buildTsvector(scope.scopeId, fullText)]);
                inserts.push(columns);
            }
        }

        for (let i = 0; i < inserts.length; i += INSERT_BATCH) {
            await db(search).insert(inserts.slice(i, i + INSERT_BATCH));
        }
    }
}

export const SearchIndexerImplementation = Abstraction.createImplementation({
    implementation: SearchIndexerImpl,
    dependencies: [
        PgSchema,
        ScopeRegistry,
        StorageTransformRegistry,
        CmsStorageModelProvider,
        KnexClient
    ]
});
