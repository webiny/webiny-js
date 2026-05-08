import WebinyError from "@webiny/error";
import { parseIdentifier, zeroPad } from "@webiny/utils";
import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import {
    isDeletedEntryMetaField,
    isRestoredEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import type { Database } from "@webiny/db-sqlite";
import { batchGet, listByPk } from "../../utils/scan.js";
import { deleteRow, getRow, upsertRow } from "../../utils/row.js";

/**
 * SQLite entry storage ops with revision lifecycle support.
 *
 * Mirrors DDB's three-row layout per entry:
 *   - sk = `R#<entryId>#<rev>`   one row per revision (the source of truth)
 *   - sk = `L#<entryId>`         "latest" pointer — full copy of the
 *                                 current latest revision's data
 *   - sk = `P#<entryId>`         "published" pointer — full copy of the
 *                                 current published revision's data
 *
 * All three rows live under the same model-scoped partition key, so a
 * single `listByPk` returns the whole partition; the `list` method then
 * filters by sk prefix (`L#` or `P#`) to pick the right "view" for the
 * `latest` / `published` where flags. FTS is keyed to the L row only —
 * search results show the latest of each entry, which matches the
 * Admin UI's expectations.
 *
 * NOTE: this is a backwards-incompatible change to entry storage —
 * previously the sk was the bare `entry.id` (`<entryId>#<rev>`), no
 * pointer rows. POC dev volumes need a `docker compose down -v` to
 * reset; production-style migrations are out of scope for the POC.
 *
 * Filter DSL — supported operators are listed in SUFFIX_OPERATORS
 * below. Currently:
 *   eq (no suffix), not, in, not_in, contains, not_contains,
 *   startsWith, not_startsWith, endsWith, not_endsWith,
 *   gt, gte, lt, lte, between, not_between.
 *
 * DDB-ES additionally supports `fuzzy` (text similarity) and
 * `and_in` (every compare value present in the array). Neither is
 * currently used by the container POC's call sites; either can be
 * added here when a real consumer needs it. Unrecognized operator
 * suffixes fall through to the eq path with the whole key as the
 * field name, which produces an empty match — fail-closed rather
 * than fail-open. Tracked in `docs/container-refactor/09-storage-ops-status.md`.
 */
export interface CreateEntriesStorageOperationsParams {
    db: Database;
}

const partitionKey = (model: CmsModel) => `T#${model.tenant}#CMS#CME#${model.modelId}`;

const splitEntryId = (id: string): { entryId: string; version: number | null } => {
    const { id: entryId, version } = parseIdentifier(id);
    return { entryId, version };
};

const revisionSk = (entryId: string, version: number) => `R#${entryId}#${zeroPad(version)}`;
const latestSk = (entryId: string) => `L#${entryId}`;
const publishedSk = (entryId: string) => `P#${entryId}`;

const skForEntry = (entry: CmsEntry): string => {
    const { entryId, version } = splitEntryId(entry.id);
    if (version === null) {
        throw new WebinyError(
            `Could not derive revision sort key from entry id: ${entry.id}`,
            "MALFORMED_ENTRY_ID",
            { id: entry.id }
        );
    }
    return revisionSk(entryId, version);
};

const ftsContent = (entry: CmsEntry, model: CmsModel): string => {
    const searchable = (model.fields ?? [])
        .filter(f => f.type === "text" || f.type === "long-text" || f.type === "rich-text")
        .map(f => entry.values?.[f.fieldId])
        .filter(v => v !== undefined && v !== null);
    return searchable.map(v => (typeof v === "string" ? v : JSON.stringify(v))).join(" ");
};

// FTS is keyed to the L pointer row so search results return one row
// per entry (the latest revision), not one per revision.
const syncFts = (db: Database, entryId: string, entry: CmsEntry, model: CmsModel) => {
    const pk = partitionKey(model);
    const sk = latestSk(entryId);
    const content = ftsContent(entry, model);
    db.sqlite.prepare("DELETE FROM items_fts WHERE pk = ? AND sk = ?").run(pk, sk);
    if (content) {
        db.sqlite
            .prepare("INSERT INTO items_fts (pk, sk, content) VALUES (?, ?, ?)")
            .run(pk, sk, content);
    }
};

const deleteFts = (db: Database, entryId: string, model: CmsModel) => {
    db.sqlite
        .prepare("DELETE FROM items_fts WHERE pk = ? AND sk = ?")
        .run(partitionKey(model), latestSk(entryId));
};

/**
 * Returns every row that belongs to a single entry in the model
 * partition: every R# revision row, plus the L pointer and the P
 * pointer when present. Used by the multi-row mutating operations
 * (move, moveToBin, restoreFromBin, delete*) that need to keep all
 * three row kinds consistent.
 */
const listEntryRows = (
    db: Database,
    model: CmsModel,
    entryId: string
): { sk: string; data: CmsEntry }[] => {
    const rows = db.sqlite
        .prepare(
            "SELECT sk, data FROM items WHERE pk = ? " +
                "AND (sk LIKE ? OR sk = ? OR sk = ?) ORDER BY sk ASC"
        )
        .all(partitionKey(model), `R#${entryId}#%`, latestSk(entryId), publishedSk(entryId)) as {
        sk: string;
        data: string;
    }[];
    return rows.map(r => ({
        sk: r.sk,
        data: JSON.parse(r.data as unknown as string) as CmsEntry
    }));
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

// `between` accepts either a [from, to] array (DDB convention) or a
// single scalar (which collapses to `value >= scalar && value <=
// scalar`, i.e. equality). Comparisons use JS's relational operators
// so strings (ISO timestamps) and numbers both work.
const matchesBetween = (actual: unknown, expected: unknown): boolean => {
    if (Array.isArray(expected)) {
        if (expected.length !== 2) {
            return false;
        }
        const [from, to] = expected as [unknown, unknown];
        return (actual as never) >= (from as never) && (actual as never) <= (to as never);
    }
    return (actual as never) >= (expected as never) && (actual as never) <= (expected as never);
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
    lte: (a, e) => typeof a === "number" && typeof e === "number" && a <= e,
    between: matchesBetween,
    not_between: (a, e) => !matchesBetween(a, e)
};

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

    if (w["values"] && typeof w["values"] === "object") {
        if (!matchesValueFilter(entry.values, w["values"] as Record<string, unknown>)) {
            return false;
        }
    }

    if (
        !matchesLocationFilter(
            entry,
            (w["wbyAco_location"] ?? w["location"]) as AcoLocationFilter | undefined
        )
    ) {
        return false;
    }

    const wbyDeleted = (entry as { wbyDeleted?: boolean }).wbyDeleted ?? false;
    if (w["wbyDeleted"] !== undefined && w["wbyDeleted"] !== wbyDeleted) {
        return false;
    }
    if (w["wbyDeleted_not"] !== undefined && w["wbyDeleted_not"] === wbyDeleted) {
        return false;
    }

    for (const [key, expected] of Object.entries(w)) {
        if (
            key === "AND" ||
            key === "OR" ||
            key === "values" ||
            key === "wbyAco_location" ||
            key === "location" ||
            key === "wbyDeleted" ||
            key === "wbyDeleted_not" ||
            // `latest` / `published` are handled at the row-prefix
            // level by `pickPointerType` below — they pick which
            // pointer rows the partition scan returns, not a
            // per-entry predicate.
            key === "latest" ||
            key === "published"
        ) {
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

// Picks which pointer-row prefix a list query should scan, based on
// the where flags. Default is L (latest) — matches Webiny's typical
// listLatestEntries call shape; explicit `published: true` switches
// to P; `latest: false, published: false` falls back to L.
const pickPointerType = (where: unknown): "L" | "P" => {
    if (!where || typeof where !== "object") {
        return "L";
    }
    if ((where as { published?: boolean }).published === true) {
        return "P";
    }
    return "L";
};

const skPrefix = (type: "L" | "P") => `${type}#`;

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { db } = params;

    const writeRow = async (model: CmsModel, sk: string, entry: CmsEntry): Promise<void> => {
        await upsertRow(db, { pk: partitionKey(model), sk }, entry, {
            gsiTenantPk: model.tenant
        });
    };

    // Writes both the revision row and the L pointer for a freshly-
    // created entry; if the entry is being created already-published
    // (rare but supported by the contract), also writes the P pointer.
    const writeNewEntry = async (model: CmsModel, entry: CmsEntry): Promise<void> => {
        const { entryId, version } = splitEntryId(entry.id);
        if (version === null) {
            throw new WebinyError(
                `Could not derive revision from entry id: ${entry.id}`,
                "MALFORMED_ENTRY_ID",
                { id: entry.id }
            );
        }
        await writeRow(model, revisionSk(entryId, version), entry);
        await writeRow(model, latestSk(entryId), entry);
        if (entry.status === CONTENT_ENTRY_STATUS.PUBLISHED) {
            await writeRow(model, publishedSk(entryId), entry);
        }
        syncFts(db, entryId, entry, model);
    };

    const getLatestRevisionRow = async (
        model: CmsModel,
        entryId: string
    ): Promise<CmsEntry | null> => {
        return getRow<CmsEntry>(db, { pk: partitionKey(model), sk: latestSk(entryId) });
    };

    const getPublishedRevisionRow = async (
        model: CmsModel,
        entryId: string
    ): Promise<CmsEntry | null> => {
        return getRow<CmsEntry>(db, { pk: partitionKey(model), sk: publishedSk(entryId) });
    };

    return {
        async create<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsCreateParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            try {
                await writeNewEntry(model, entry);
                return p.entry;
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not create entry.",
                    "CREATE_ENTRY_ERROR",
                    { id: entry.id }
                );
            }
        },

        async createRevisionFrom<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsCreateRevisionFromParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            const { entryId, version } = splitEntryId(entry.id);
            if (version === null) {
                throw new WebinyError(
                    `Could not derive revision from entry id: ${entry.id}`,
                    "MALFORMED_ENTRY_ID",
                    { id: entry.id }
                );
            }
            try {
                // 1. Write the new revision row.
                await writeRow(model, revisionSk(entryId, version), entry);
                // 2. Move the L pointer to the new revision.
                await writeRow(model, latestSk(entryId), entry);
                // 3. If the new revision is being created already-
                //    published, swap the P pointer and unpublish the
                //    previously-published revision (if any).
                if (entry.status === CONTENT_ENTRY_STATUS.PUBLISHED) {
                    const previouslyPublished = await getPublishedRevisionRow(model, entryId);
                    await writeRow(model, publishedSk(entryId), entry);
                    if (previouslyPublished && previouslyPublished.id !== entry.id) {
                        const prevSk = skForEntry(previouslyPublished);
                        const updated = {
                            ...previouslyPublished,
                            status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                        };
                        await writeRow(model, prevSk, updated);
                    }
                }
                syncFts(db, entryId, entry, model);
                return p.entry;
            } catch (ex) {
                throw new WebinyError(
                    ex instanceof Error ? ex.message : "Could not create revision.",
                    "CREATE_REVISION_ERROR",
                    { id: entry.id }
                );
            }
        },

        async update<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsUpdateParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            const { entryId } = splitEntryId(entry.id);
            try {
                // 1. Always update the revision row.
                await writeRow(model, skForEntry(entry), entry);
                // 2. If the published flag is set, also rewrite the P
                //    pointer with the latest data.
                if (entry.status === CONTENT_ENTRY_STATUS.PUBLISHED) {
                    await writeRow(model, publishedSk(entryId), entry);
                }
                // 3. If we're updating the latest revision, refresh the
                //    L pointer.
                const currentLatest = await getLatestRevisionRow(model, entryId);
                if (currentLatest && currentLatest.id === entry.id) {
                    await writeRow(model, latestSk(entryId), entry);
                    syncFts(db, entryId, entry, model);
                }
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
            const idCandidate = (p.where as { id?: string }).id;
            if (idCandidate) {
                const { entryId } = splitEntryId(idCandidate);
                const latest = await getLatestRevisionRow(model, entryId);
                if (latest && latest.id === idCandidate) {
                    return latest as unknown as CmsEntry<T>;
                }
                // Fall through to revision row lookup when the id
                // refers to a non-latest revision.
                const rev = await getRow<CmsEntry>(db, {
                    pk: partitionKey(model),
                    sk: skForEntry({ id: idCandidate } as CmsEntry)
                });
                return rev as unknown as CmsEntry<T> | null;
            }
            // No id filter: return the first L row in the partition
            // (matches the previous "first row wins" behavior, which
            // the upstream callers don't rely on heavily).
            const partition = await listByPk<CmsEntry>(db, partitionKey(model));
            return (partition[0] ?? null) as unknown as CmsEntry<T> | null;
        },

        async list<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsListParams
        ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> {
            // listByPk returns only row.data; we filter on sk prefix
            // here, so query the partition directly with sk in scope.
            const type = pickPointerType(p.where);
            const prefix = skPrefix(type);
            const rows = db.sqlite
                .prepare("SELECT data FROM items WHERE pk = ? AND sk LIKE ? ORDER BY sk ASC")
                .all(partitionKey(model), `${prefix}%`) as { data: string }[];
            const candidates = rows.map(r => JSON.parse(r.data as unknown as string) as CmsEntry);

            const filtered = candidates.filter(entry => matchesWhere(entry, p.where));
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
            // ids here are revision ids (`<entryId>#<rev>`).
            const keys = (p.ids ?? []).map(id => ({ pk, sk: skForEntry({ id } as CmsEntry) }));
            const rows = await batchGet<CmsEntry>(db, keys);
            return rows as unknown as CmsEntry<T>[];
        },

        async getLatestByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: { ids: readonly string[] }
        ) {
            const pk = partitionKey(model);
            // ids may be entryIds OR revision ids — strip to entryId for the L lookup.
            const keys = (p.ids ?? []).map(id => {
                const { entryId } = splitEntryId(id);
                return { pk, sk: latestSk(entryId) };
            });
            const rows = await batchGet<CmsEntry>(db, keys);
            return rows as unknown as CmsEntry<T>[];
        },

        async getPublishedByIds<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: { ids: readonly string[] }
        ) {
            const pk = partitionKey(model);
            const keys = (p.ids ?? []).map(id => {
                const { entryId } = splitEntryId(id);
                return { pk, sk: publishedSk(entryId) };
            });
            const rows = await batchGet<CmsEntry>(db, keys);
            return rows as unknown as CmsEntry<T>[];
        },

        async getLatestRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: { id: string }
        ) {
            const { entryId } = splitEntryId(p.id);
            const row = await getLatestRevisionRow(model, entryId);
            return row as unknown as CmsEntry<T> | null;
        },

        async getPublishedRevisionByEntryId<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetPublishedRevisionParams
        ) {
            const { entryId } = splitEntryId(p.id);
            const row = await getPublishedRevisionRow(model, entryId);
            return row as unknown as CmsEntry<T> | null;
        },

        async getRevisions<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetRevisionsParams
        ) {
            const { entryId } = splitEntryId(p.id);
            const rows = db.sqlite
                .prepare("SELECT data FROM items WHERE pk = ? AND sk LIKE ? ORDER BY sk ASC")
                .all(partitionKey(model), `R#${entryId}#%`) as { data: string }[];
            return rows.map(r =>
                JSON.parse(r.data as unknown as string)
            ) as unknown as CmsEntry<T>[];
        },

        async getRevisionById<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetRevisionParams
        ) {
            const row = await getRow<CmsEntry>(db, {
                pk: partitionKey(model),
                sk: skForEntry({ id: p.id } as CmsEntry)
            });
            return row as unknown as CmsEntry<T> | null;
        },

        async getPreviousRevision<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetPreviousRevisionParams
        ) {
            // Highest revision strictly below `p.version`.
            const targetSk = revisionSk(p.entryId, p.version);
            const rows = db.sqlite
                .prepare(
                    "SELECT data FROM items WHERE pk = ? AND sk LIKE ? AND sk < ? ORDER BY sk DESC LIMIT 1"
                )
                .all(partitionKey(model), `R#${p.entryId}#%`, targetSk) as { data: string }[];
            if (rows.length === 0) {
                return null;
            }
            return JSON.parse(rows[0]!.data as unknown as string) as unknown as CmsEntry<T>;
        },

        async delete(model, p) {
            const { entry } = p;
            const { entryId } = splitEntryId(entry.id);
            const pk = partitionKey(model);
            // Wipe every row belonging to this entry — all R# rows,
            // plus the L and P pointers.
            db.sqlite
                .prepare("DELETE FROM items WHERE pk = ? AND sk LIKE ?")
                .run(pk, `R#${entryId}#%`);
            await deleteRow(db, { pk, sk: latestSk(entryId) });
            await deleteRow(db, { pk, sk: publishedSk(entryId) });
            deleteFts(db, entryId, model);
        },

        async deleteRevision(model, p) {
            const { entry } = p;
            const { entryId } = splitEntryId(entry.id);
            const pk = partitionKey(model);
            // Drop just this revision's row.
            await deleteRow(db, { pk, sk: skForEntry(entry) });
            // If this revision happens to be the published one, clear
            // the P pointer too (matches DDB's deleteRevision behavior).
            const published = await getPublishedRevisionRow(model, entryId);
            if (published && published.id === entry.id) {
                await deleteRow(db, { pk, sk: publishedSk(entryId) });
            }
            // L pointer is left to whoever calls update(latest) next —
            // the upstream use case re-points L explicitly.
        },

        async publish<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsPublishParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            const { entryId } = splitEntryId(entry.id);

            const initialLatest = await getLatestRevisionRow(model, entryId);
            if (!initialLatest) {
                throw new WebinyError(
                    `Could not publish entry. Could not load latest ("L") record.`,
                    "PUBLISH_ERROR",
                    { id: entry.id }
                );
            }
            const initialPublished = await getPublishedRevisionRow(model, entryId);

            // 1. Rewrite the revision row + P pointer with the new data.
            await writeRow(model, skForEntry(entry), entry);
            await writeRow(model, publishedSk(entryId), entry);

            const publishingLatest = entry.id === initialLatest.id;
            if (publishingLatest) {
                // 2.1 Update L to match the published payload.
                await writeRow(model, latestSk(entryId), entry);
                // 2.2 If a different revision was previously published,
                //     mark its R# row as unpublished.
                if (initialPublished && initialPublished.id !== entry.id) {
                    const updated = {
                        ...initialPublished,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    };
                    await writeRow(model, skForEntry(initialPublished), updated);
                }
            } else {
                // 2.3 We're publishing a non-latest revision. The L
                //     pointer's status flips from "published" (if it
                //     was) to "unpublished", and the L's R# row gets
                //     the same treatment.
                let latestStatus = initialLatest.status;
                if (latestStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                    latestStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
                }
                const updatedLatest = { ...initialLatest, status: latestStatus };
                await writeRow(model, latestSk(entryId), updatedLatest);
                await writeRow(model, skForEntry(initialLatest), updatedLatest);
                // 2.4 If the prior published revision was different from
                //     the latest, mark its R# row as unpublished too.
                if (
                    initialPublished &&
                    initialPublished.id !== initialLatest.id &&
                    initialPublished.id !== entry.id
                ) {
                    const updated = {
                        ...initialPublished,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    };
                    await writeRow(model, skForEntry(initialPublished), updated);
                }
            }

            // FTS tracks the latest, which may have shifted status.
            const finalLatest = await getLatestRevisionRow(model, entryId);
            if (finalLatest) {
                syncFts(db, entryId, finalLatest, model);
            }

            return p.entry;
        },

        async unpublish<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsUnpublishParams<T>
        ) {
            const entry = p.entry as unknown as CmsEntry;
            const { entryId } = splitEntryId(entry.id);
            const pk = partitionKey(model);

            // 1. Delete the P pointer.
            await deleteRow(db, { pk, sk: publishedSk(entryId) });
            // 2. Rewrite the revision row with the new (unpublished) data.
            await writeRow(model, skForEntry(entry), entry);

            // 3. If we're unpublishing the latest revision, refresh L too.
            const initialLatest = await getLatestRevisionRow(model, entryId);
            if (initialLatest && initialLatest.id === entry.id) {
                await writeRow(model, latestSk(entryId), entry);
                syncFts(db, entryId, entry, model);
            }

            return p.entry;
        },

        async move(model, id, folderId) {
            // Mirror DDB: walk every row for the entry (R# revisions + L + P)
            // and rewrite `location.folderId` on each. Touching only the L
            // pointer would leave older revisions stranded in the prior folder.
            const { entryId } = splitEntryId(id);
            const rows = listEntryRows(db, model, entryId);
            if (rows.length === 0) {
                return;
            }
            for (const { sk, data } of rows) {
                const updated = {
                    ...data,
                    location: { ...(data.location ?? {}), folderId }
                };
                await writeRow(model, sk, updated as CmsEntry);
            }
        },

        async moveToBin<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsMoveToBinParams<T>
        ) {
            const incoming = p.storageEntry as unknown as CmsEntry;
            const { entryId } = splitEntryId(incoming.id);
            const rows = listEntryRows(db, model, entryId);
            if (rows.length === 0) {
                return;
            }
            // Pick only the deleted-* meta fields off the incoming entry — those
            // are what changes in moveToBin. We then merge them onto every
            // existing row alongside the bin-state fields. The values, location,
            // status, etc. on each row stay as they were.
            const deletedMeta = pickEntryMetaFields(
                incoming as unknown as Record<string, unknown>,
                isDeletedEntryMetaField
            );
            for (const { sk, data } of rows) {
                const updated = {
                    ...data,
                    ...deletedMeta,
                    wbyDeleted: incoming.wbyDeleted,
                    location: incoming.location,
                    binOriginalFolderId: (incoming as { binOriginalFolderId?: string })
                        .binOriginalFolderId
                };
                await writeRow(model, sk, updated as CmsEntry);
            }
        },

        async restoreFromBin<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            p: CmsEntryStorageOperationsRestoreFromBinParams<T>
        ) {
            const incoming = p.storageEntry as unknown as CmsEntry;
            const { entryId } = splitEntryId(incoming.id);
            const rows = listEntryRows(db, model, entryId);
            if (rows.length === 0) {
                return p.entry;
            }
            // Same shape as moveToBin but with the restored-* meta fields.
            const restoredMeta = pickEntryMetaFields(
                incoming as unknown as Record<string, unknown>,
                isRestoredEntryMetaField
            );
            for (const { sk, data } of rows) {
                const updated = {
                    ...data,
                    ...restoredMeta,
                    wbyDeleted: incoming.wbyDeleted,
                    location: incoming.location,
                    binOriginalFolderId: (incoming as { binOriginalFolderId?: string })
                        .binOriginalFolderId
                };
                await writeRow(model, sk, updated as CmsEntry);
            }
            return p.entry;
        },

        async deleteMultipleEntries(
            model: CmsModel,
            p: CmsEntryStorageOperationsDeleteEntriesParams
        ) {
            // Each id may be either an entryId or a revision id; strip to
            // the bare entryId for the partition wipe. Wraps the per-entry
            // deletes in a single sqlite transaction so a partial failure
            // doesn't leave stranded R#/L/P rows.
            const ids = p.entries ?? [];
            if (ids.length === 0) {
                return;
            }
            const pk = partitionKey(model);
            const tx = db.sqlite.transaction((entryIds: string[]) => {
                const wipeRevs = db.sqlite.prepare("DELETE FROM items WHERE pk = ? AND sk LIKE ?");
                const wipePointer = db.sqlite.prepare("DELETE FROM items WHERE pk = ? AND sk = ?");
                const wipeFts = db.sqlite.prepare("DELETE FROM items_fts WHERE pk = ? AND sk = ?");
                for (const rawId of entryIds) {
                    const { entryId } = splitEntryId(rawId);
                    wipeRevs.run(pk, `R#${entryId}#%`);
                    wipePointer.run(pk, latestSk(entryId));
                    wipePointer.run(pk, publishedSk(entryId));
                    wipeFts.run(pk, latestSk(entryId));
                }
            });
            tx(ids);
        },

        async getUniqueFieldValues(
            model: CmsModel,
            p: CmsEntryStorageOperationsGetUniqueFieldValuesParams
        ): Promise<CmsEntryUniqueValue[]> {
            const field = (model.fields ?? []).find(f => f.fieldId === p.fieldId);
            if (!field) {
                throw new WebinyError(
                    `Could not find field with given "fieldId" value.`,
                    "FIELD_NOT_FOUND",
                    { fieldId: p.fieldId }
                );
            }
            // Mirror DDB: list matching entries (latest pointer rows by
            // default), then count distinct values across them. Field can
            // be a scalar or an array of scalars.
            const type = pickPointerType(p.where);
            const prefix = skPrefix(type);
            const rows = db.sqlite
                .prepare("SELECT data FROM items WHERE pk = ? AND sk LIKE ? ORDER BY sk ASC")
                .all(partitionKey(model), `${prefix}%`) as { data: string }[];
            const candidates = rows
                .map(r => JSON.parse(r.data as unknown as string) as CmsEntry)
                .filter(entry => matchesWhere(entry, p.where));

            const counts: Record<string, number> = {};
            for (const entry of candidates) {
                const raw = entry.values?.[p.fieldId];
                if (raw === undefined || raw === null) {
                    continue;
                }
                const values = Array.isArray(raw) ? raw : [raw];
                for (const v of values) {
                    if (typeof v !== "string" || v.length === 0) {
                        continue;
                    }
                    counts[v] = (counts[v] ?? 0) + 1;
                }
            }
            return Object.entries(counts)
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => (a.value > b.value ? 1 : a.value < b.value ? -1 : 0))
                .sort((a, b) => b.count - a.count);
        }
    };
};
