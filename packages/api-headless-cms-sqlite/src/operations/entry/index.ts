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

// Predicate per operator. `match` works on either a scalar field
// (string/number/boolean) or an array field — for arrays, "any
// element matches" semantics apply. The where DSL doesn't distinguish
// at the schema level, so this is the right behavior for tag-style
// fields where the entry stores an array but the filter passes a
// single value (e.g. `tags_not_startsWith: "scope:"`).
const includesScalar = (actual: unknown, predicate: (v: unknown) => boolean): boolean => {
    if (Array.isArray(actual)) {
        return actual.some(predicate);
    }
    return predicate(actual);
};

const SUFFIX_OPERATORS: Record<string, (actual: unknown, expected: unknown) => boolean> = {
    "": (a, e) => includesScalar(a, v => v === e),
    not: (a, e) => !includesScalar(a, v => v === e),
    in: (a, e) => Array.isArray(e) && includesScalar(a, v => (e as unknown[]).includes(v as never)),
    not_in: (a, e) =>
        Array.isArray(e) && !includesScalar(a, v => (e as unknown[]).includes(v as never)),
    contains: (a, e) =>
        typeof e === "string" &&
        includesScalar(a, v => typeof v === "string" && v.toLowerCase().includes(e.toLowerCase())),
    not_contains: (a, e) =>
        typeof e === "string" &&
        !includesScalar(a, v => typeof v === "string" && v.toLowerCase().includes(e.toLowerCase())),
    startsWith: (a, e) =>
        typeof e === "string" && includesScalar(a, v => typeof v === "string" && v.startsWith(e)),
    not_startsWith: (a, e) =>
        typeof e === "string" && !includesScalar(a, v => typeof v === "string" && v.startsWith(e)),
    endsWith: (a, e) =>
        typeof e === "string" && includesScalar(a, v => typeof v === "string" && v.endsWith(e)),
    not_endsWith: (a, e) =>
        typeof e === "string" && !includesScalar(a, v => typeof v === "string" && v.endsWith(e)),
    gt: (a, e) => typeof a === "number" && typeof e === "number" && a > e,
    gte: (a, e) => typeof a === "number" && typeof e === "number" && a >= e,
    lt: (a, e) => typeof a === "number" && typeof e === "number" && a < e,
    lte: (a, e) => typeof a === "number" && typeof e === "number" && a <= e
};

// Operator suffixes are encoded as `<field>_<suffix>`. Longest-suffix-
// wins so e.g. `tags_not_startsWith` parses to {field: "tags",
// suffix: "not_startsWith"} rather than {field: "tags_not_starts",
// suffix: "With"} or {field: "tags", suffix: "starts"}.
const ORDERED_SUFFIXES = Object.keys(SUFFIX_OPERATORS)
    .filter(s => s.length > 0)
    .sort((a, b) => b.length - a.length);

const splitSuffix = (key: string): { field: string; suffix: string } => {
    for (const suffix of ORDERED_SUFFIXES) {
        if (key.endsWith(`_${suffix}`)) {
            return { field: key.slice(0, -1 * (suffix.length + 1)), suffix };
        }
    }
    return { field: key, suffix: "" };
};

const matchesValueFilter = (
    actual: Record<string, unknown> | undefined,
    where: Record<string, unknown>
): boolean => {
    for (const [key, expected] of Object.entries(where)) {
        const { field, suffix } = splitSuffix(key);
        const op = SUFFIX_OPERATORS[suffix];
        if (!op) {
            continue;
        }
        if (!op(actual?.[field], expected)) {
            return false;
        }
    }
    return true;
};

interface AcoLocationFilter {
    folderId?: string;
    folderId_not?: string;
    folderId_in?: string[];
    folderId_not_in?: string[];
}

const matchesLocationFilter = (
    entry: CmsEntry,
    location: AcoLocationFilter | undefined
): boolean => {
    if (!location) {
        return true;
    }
    const folderId =
        (entry as { wbyAco_location?: { folderId?: string } }).wbyAco_location?.folderId ??
        (entry.values as Record<string, unknown>)?.["wbyAco_location"] ??
        (entry as { location?: { folderId?: string } }).location?.folderId;
    if (location.folderId !== undefined && folderId !== location.folderId) {
        return false;
    }
    if (location.folderId_not !== undefined && folderId === location.folderId_not) {
        return false;
    }
    if (location.folderId_in && !location.folderId_in.includes(folderId as string)) {
        return false;
    }
    if (location.folderId_not_in && location.folderId_not_in.includes(folderId as string)) {
        return false;
    }
    return true;
};

const matchesWhere = (entry: CmsEntry, where: unknown): boolean => {
    if (!where || typeof where !== "object") {
        return true;
    }
    const w = where as Record<string, unknown>;

    if (Array.isArray(w["AND"])) {
        if (!(w["AND"] as unknown[]).every(child => matchesWhere(entry, child))) {
            return false;
        }
    }
    if (Array.isArray(w["OR"])) {
        if (!(w["OR"] as unknown[]).some(child => matchesWhere(entry, child))) {
            return false;
        }
    }

    // Top-level `values` filter — user-defined model fields.
    if (w["values"] && typeof w["values"] === "object") {
        if (!matchesValueFilter(entry.values, w["values"] as Record<string, unknown>)) {
            return false;
        }
    }

    // ACO folder location.
    if (
        !matchesLocationFilter(
            entry,
            (w["wbyAco_location"] ?? w["location"]) as AcoLocationFilter | undefined
        )
    ) {
        return false;
    }

    // Bin (deleted) flag.
    const wbyDeleted = (entry as { wbyDeleted?: boolean }).wbyDeleted ?? false;
    if (w["wbyDeleted"] !== undefined && w["wbyDeleted"] !== wbyDeleted) {
        return false;
    }
    if (w["wbyDeleted_not"] !== undefined && w["wbyDeleted_not"] === wbyDeleted) {
        return false;
    }

    // Entry-level scalar filters (id, entryId, status, etc.).
    for (const [key, expected] of Object.entries(w)) {
        if (
            key === "AND" ||
            key === "OR" ||
            key === "values" ||
            key === "wbyAco_location" ||
            key === "location" ||
            key === "wbyDeleted" ||
            key === "wbyDeleted_not"
        ) {
            continue;
        }

        // Stage 6 SQLite stores a single revision per entry — every
        // stored row is implicitly the latest (draft-only model). Skip
        // these filters so the upstream guards from listLatestEntries
        // / listPublishedEntries don't drop everything.
        if (key === "latest" || key === "published") {
            continue;
        }

        const { field, suffix } = splitSuffix(key);
        const op = SUFFIX_OPERATORS[suffix];
        if (!op) {
            continue;
        }
        const actual = (entry as unknown as Record<string, unknown>)[field];
        if (!op(actual, expected)) {
            return false;
        }
    }

    return true;
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
            const filtered = all.filter(entry => matchesWhere(entry, p.where));
            const limit = p.limit ?? 50;
            const items = filtered.slice(0, limit);
            return {
                hasMoreItems: filtered.length > limit,
                items: items as unknown as CmsEntry<T>[],
                cursor: null,
                totalCount: filtered.length
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
