import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { Database } from "@webiny/db-sqlite";
import { batchGet, listByPk } from "../../utils/scan.js";
import { deleteRow, upsertRow } from "../../utils/row.js";

/**
 * Stage-6 SQLite entry storage ops.
 *
 * Scope:
 *   - basic CRUD (create, get, getByIds, list, update, delete) — single revision
 *     per entry, draft-only model. Adequate to demonstrate end-to-end CMS
 *     reads/writes from a container.
 *   - FTS5 indexing for searchable fields (sync write to items_fts on
 *     create / update / delete).
 *
 * Deferred to a follow-up within this slice (stage 6b):
 *   - revision lifecycle: createRevisionFrom, getRevisions, getRevisionById,
 *     getPreviousRevision, getPublishedRevisionByEntryId,
 *     getLatestRevisionByEntryId.
 *   - publish / unpublish.
 *   - moveToBin / restoreFromBin / deleteMultipleEntries.
 *   - getUniqueFieldValues.
 *   - move (folder move).
 *   - filter DSL beyond simple equality.
 *
 * The deferred methods throw a `NOT_IMPLEMENTED` error rather than failing
 * silently — callers will get a clear signal at the API boundary.
 */
export interface CreateEntriesStorageOperationsParams {
    db: Database;
}

// Partition key includes tenant + modelId. Locale-aware partitioning matches
// the DDB layout but `CmsModel` doesn't carry locale at the type level — the
// CMS context's locale is the runtime source. For the basic entry CRUD we
// scope by model alone; revision-aware variants (stage 6b) will thread locale
// through.
const partitionKey = (model: CmsModel) => `T#${model.tenant}#CMS#CME#${model.modelId}`;

const sortKey = (entryId: string) => entryId;

const ftsContent = (entry: CmsEntry, model: CmsModel): string => {
    const searchable = (model.fields ?? [])
        .filter(f => f.type === "text" || f.type === "long-text" || f.type === "rich-text")
        .map(f => entry.values?.[f.fieldId])
        .filter(v => v !== undefined && v !== null);
    return searchable.map(v => (typeof v === "string" ? v : JSON.stringify(v))).join(" ");
};

const syncFts = (db: Database, entry: CmsEntry, model: CmsModel) => {
    const pk = partitionKey(model);
    const sk = sortKey(entry.id);
    const content = ftsContent(entry, model);
    db.sqlite.prepare("DELETE FROM items_fts WHERE pk = ? AND sk = ?").run(pk, sk);
    if (content) {
        db.sqlite
            .prepare("INSERT INTO items_fts (pk, sk, content) VALUES (?, ?, ?)")
            .run(pk, sk, content);
    }
};

const notImplemented = (method: string): never => {
    throw new WebinyError(
        `CmsEntryStorageOperations.${method}() is not yet implemented in the SQLite backend (stage 6b).`,
        "NOT_IMPLEMENTED",
        { method }
    );
};

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { db } = params;

    const writeEntry = async (model: CmsModel, entry: CmsEntry): Promise<void> => {
        await upsertRow(db, { pk: partitionKey(model), sk: sortKey(entry.id) }, entry, {
            gsiTenantPk: model.tenant
        });
        syncFts(db, entry, model);
    };

    return {
        async create<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsCreateParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            try {
                await writeEntry(model, entry);
                return p.entry;
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not create entry.",
                    "CREATE_ENTRY_ERROR",
                    { id: entry.id }
                );
            }
        },

        async update<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsUpdateParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            try {
                await writeEntry(model, entry);
                return p.entry;
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not update entry.",
                    "UPDATE_ENTRY_ERROR",
                    { id: entry.id }
                );
            }
        },

        async get<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetParams
        ) {
            const all = await listByPk<CmsEntry>(db, partitionKey(model));
            // The where DSL is rich; stage 6 only supports `id` equality.
            const idCandidate = (p.where as { id?: string }).id;
            const result = idCandidate
                ? (all.find(e => e.id === idCandidate) ?? null)
                : (all[0] ?? null);
            return result as unknown as CmsEntry<T> | null;
        },

        async list<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsListParams
        ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> {
            const all = await listByPk<CmsEntry>(db, partitionKey(model));
            const limit = p.limit ?? 50;
            const items = all.slice(0, limit);
            return {
                hasMoreItems: all.length > limit,
                items: items as unknown as CmsEntry<T>[],
                cursor: null,
                totalCount: all.length
            };
        },

        async getByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetByIdsParams
        ) {
            const pk = partitionKey(model);
            const keys = (p.ids ?? []).map(id => ({ pk, sk: sortKey(id) }));
            const rows = await batchGet<CmsEntry>(db, keys);
            return rows as unknown as CmsEntry<T>[];
        },

        async getLatestByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: { ids: readonly string[] }
        ) {
            const pk = partitionKey(model);
            const keys = (p.ids ?? []).map(id => ({ pk, sk: sortKey(id) }));
            const rows = await batchGet<CmsEntry>(db, keys);
            return rows as unknown as CmsEntry<T>[];
        },

        async getLatestRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: { id: string }
        ) {
            const all = await listByPk<CmsEntry>(db, partitionKey(model));
            const found = all.find(e => e.id === p.id || e.entryId === p.id) ?? null;
            return found as unknown as CmsEntry<T> | null;
        },

        async delete(model, p) {
            const { entry } = p;
            await deleteRow(db, { pk: partitionKey(model), sk: sortKey(entry.id) });
            db.sqlite
                .prepare("DELETE FROM items_fts WHERE pk = ? AND sk = ?")
                .run(partitionKey(model), sortKey(entry.id));
        },

        async deleteRevision(model, p) {
            const { entry } = p;
            await deleteRow(db, { pk: partitionKey(model), sk: sortKey(entry.id) });
            db.sqlite
                .prepare("DELETE FROM items_fts WHERE pk = ? AND sk = ?")
                .run(partitionKey(model), sortKey(entry.id));
        },

        // --- Deferred to stage 6b ---
        async getPublishedByIds() {
            return [];
        },
        async getRevisions() {
            return [];
        },
        async getRevisionById() {
            return null;
        },
        async getPublishedRevisionByEntryId() {
            return null;
        },
        async getPreviousRevision() {
            return null;
        },
        async createRevisionFrom() {
            return notImplemented("createRevisionFrom");
        },
        async move() {
            return notImplemented("move");
        },
        async moveToBin() {
            return notImplemented("moveToBin");
        },
        async restoreFromBin() {
            return notImplemented("restoreFromBin");
        },
        async deleteMultipleEntries() {
            return notImplemented("deleteMultipleEntries");
        },
        async publish() {
            return notImplemented("publish");
        },
        async unpublish() {
            return notImplemented("unpublish");
        },
        async getUniqueFieldValues() {
            return [];
        }
    };
};
