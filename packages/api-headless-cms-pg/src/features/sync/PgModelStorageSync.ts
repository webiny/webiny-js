import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ModelStorageSync } from "@webiny/api-headless-cms/features/modelStorageSync/index.js";
import { KnexClient } from "@webiny/api-core-sql";
import { PgSchema } from "~/features/schema/abstractions.js";
import { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { settingsOf } from "~/features/scopes/allocateSlots.js";
import { SearchIndexer } from "~/features/search/abstractions.js";
import { createNullToken, overflowTokenKey } from "~/features/search/tokens.js";
import { MODE_LOCK_SHARED_SQL } from "~/features/indexMode/indexMode.js";

/* Search rows per batch for column work (one short transaction each). */
const ROW_BATCH = 2000;
/* Entries per batch for a rebuild (each entry has up to two rows, and each is rebuilt from its data). */
const ENTRY_BATCH = 500;

type IWork =
    | { kind: "retired"; key: string; slot?: string; overflow?: true }
    | { kind: "filling"; key: string; slot: string }
    | { kind: "reindex"; keys: string[] };

interface ICursor {
    work: IWork;
    /* Rows: last (view, entry_id) done. Rebuild: last entry_id done. */
    after: [number, string] | string | null;
}

const sameWork = (a: IWork, b: IWork): boolean => JSON.stringify(a) === JSON.stringify(b);

/* The next piece of work: clear retired assignments first (frees slots), then fill, then rebuild. */
const nextWork = (stored: ScopeRegistry.SlotMap): IWork | null => {
    const retired = stored.retired?.[0];
    if (retired) {
        return { kind: "retired", ...retired };
    }
    const states = Object.entries(stored.state || {});
    for (const [key, state] of states) {
        const slot = stored.slots[key];
        if (state === "filling" && slot) {
            return { kind: "filling", key, slot };
        }
    }
    const keys = states.filter(([, state]) => state !== "filling").map(([key]) => key);
    // A "filling" key without a slot (moved to overflow since) has nothing to fill: rebuild it.
    keys.push(
        ...states
            .filter(([key, state]) => state === "filling" && !stored.slots[key])
            .map(([key]) => key)
    );
    return keys.length > 0 ? { kind: "reindex", keys: keys.sort() } : null;
};

/**
 * pg's part of the background sync after a model change (model changes spec, §8): clears
 * the columns and tokens of retired assignments, adds null tokens for new sortable slots, and
 * rebuilds rows of keys marked for a reindex. Everything is in batches, each in its own short
 * transaction, and every batch is idempotent: rows written meanwhile already have their final
 * shape, and running a step twice (two tasks, a retried task) changes nothing.
 */
class PgModelStorageSyncImpl implements ModelStorageSync.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly scopes: ScopeRegistry.Interface,
        private readonly indexer: SearchIndexer.Interface
    ) {}

    public async needsSync(model: CmsModel): Promise<boolean> {
        const scope = await this.scopes.get(model);
        return scope.pending;
    }

    public async run(
        model: CmsModel,
        params: ModelStorageSync.RunParams
    ): Promise<ModelStorageSync.RunResult> {
        let cursor: ICursor | null = params.cursor ? JSON.parse(params.cursor) : null;
        // Every call does at least one batch, so a caller with little time left still progresses.
        let batches = 0;
        for (;;) {
            // Fresh every step: the model may have changed again, and finished work is stored.
            this.scopes.forget(model);
            const scope = await this.scopes.get(model);
            const work = nextWork(scope.stored);
            if (!work) {
                return { done: true, cursor: null };
            }
            if (!cursor || !sameWork(cursor.work, work)) {
                cursor = { work, after: null };
            }
            if (batches > 0 && Date.now() > params.deadline) {
                return { done: false, cursor: JSON.stringify(cursor) };
            }
            batches++;
            const after = await this.batch(model, scope, cursor);
            if (after === null) {
                await this.finish(model, scope, work);
                cursor = null;
            } else {
                cursor.after = after;
            }
        }
    }

    /* One batch of `cursor.work`; returns where the next one starts, or null when the work is done. */
    private async batch(
        model: CmsModel,
        scope: ScopeRegistry.Scope,
        cursor: ICursor
    ): Promise<ICursor["after"]> {
        const { work } = cursor;
        if (work.kind === "reindex") {
            const result = await this.indexer.reindexEntries(model, {
                after: (cursor.after as string | null) ?? null,
                limit: ENTRY_BATCH
            });
            return result.cursor;
        }
        const { search, scopes } = this.schema.getTables();
        const { scopeId } = scope;
        const after = cursor.after as [number, string] | null;

        let set: string;
        let needs: string;
        const setBindings: Knex.RawBinding[] = [];
        const needsBindings: Knex.RawBinding[] = [];
        if (work.kind === "filling") {
            // Every row without a value gets the null token, so sorted lists find it by the token.
            const token = createNullToken(scopeId, work.slot);
            set = `tok = s.tok || ARRAY[?]::text[]`;
            setBindings.push(token);
            needs = `s."${work.slot}" IS NULL AND NOT s.tok @> ARRAY[?]::text[]`;
            needsBindings.push(token);
        } else if (work.slot) {
            // The column, its value tokens ("<scope>:<slot>:<value>") and its null token go.
            const prefix = `${scopeId}:${work.slot}:`;
            const token = createNullToken(scopeId, work.slot);
            set = `"${work.slot}" = NULL, tok = ARRAY(SELECT t FROM unnest(s.tok) t WHERE t <> ? AND left(t, ?) <> ?)`;
            setBindings.push(token, prefix.length, prefix);
            needs = `(s."${work.slot}" IS NOT NULL OR s.tok @> ARRAY[?]::text[])`;
            needsBindings.push(token);
        } else {
            // An overflow key: its `ov` value and its "<scope>:o:<key>:<value>" tokens go.
            const prefix = `${scopeId}:${overflowTokenKey(work.key)}:`;
            set = `ov = NULLIF(s.ov - ?, '{}'::jsonb), tok = ARRAY(SELECT t FROM unnest(s.tok) t WHERE left(t, ?) <> ?)`;
            setBindings.push(work.key, prefix.length, prefix);
            needs = `(s.ov -> ?) IS NOT NULL`;
            needsBindings.push(work.key);
        }

        return this.knex.client.transaction(async trx => {
            // As a write does: a mode change waits for this batch, and sees its rows.
            await trx.raw(MODE_LOCK_SHARED_SQL, [scopes, scopeId]);
            // The next rows of the scope in key order, whether or not they need the change, so
            // the walk is linear however many rows are already done.
            const page = await trx.raw(
                `SELECT view, entry_id FROM "${search}"
                 WHERE scope_id = ? ${after ? "AND (view, entry_id) > (?, ?)" : ""}
                 ORDER BY view, entry_id LIMIT ?`,
                after ? [scopeId, after[0], after[1], ROW_BATCH] : [scopeId, ROW_BATCH]
            );
            const rows: { view: number; entry_id: string }[] = page.rows;
            if (rows.length === 0) {
                return null;
            }
            const last = rows[rows.length - 1];
            await trx.raw(
                `UPDATE "${search}" s SET ${set}
                 WHERE s.scope_id = ? AND (s.view, s.entry_id) >= (?, ?) AND (s.view, s.entry_id) <= (?, ?)
                   AND ${needs}`,
                [
                    ...setBindings,
                    scopeId,
                    rows[0].view,
                    rows[0].entry_id,
                    last.view,
                    last.entry_id,
                    ...needsBindings
                ]
            );
            return rows.length < ROW_BATCH ? null : [last.view, last.entry_id];
        });
    }

    /* Records finished work in the stored map (other work may have been added meanwhile). */
    private async finish(model: CmsModel, scope: ScopeRegistry.Scope, work: IWork): Promise<void> {
        const settingsByKey = new Map(
            Object.values(scope.plan.paths).map(entry => [entry.key, settingsOf(entry)])
        );
        await this.scopes.update(model, stored => {
            const state = { ...stored.state };
            const settings = { ...stored.settings };
            let retired = [...(stored.retired || [])];
            const gone = { ...stored.gone };
            if (work.kind === "retired") {
                retired = retired.filter(
                    entry =>
                        !(
                            entry.key === work.key &&
                            entry.slot === work.slot &&
                            entry.overflow === work.overflow
                        )
                );
                if (!stored.slots[work.key] && !stored.overflow[work.key]) {
                    gone[work.key] = true;
                }
            } else if (work.kind === "filling") {
                if (state[work.key] === "filling") {
                    delete state[work.key];
                }
            } else {
                // Only the keys this pass started with: rows rebuilt before a key was marked lack it.
                for (const key of work.keys) {
                    if (!state[key]) {
                        continue;
                    }
                    delete state[key];
                    const wanted = settingsByKey.get(key);
                    if (wanted !== undefined) {
                        settings[key] = wanted;
                    }
                }
            }
            return { ...stored, state, settings, retired, gone };
        });
    }
}

export const PgModelStorageSync = ModelStorageSync.createImplementation({
    implementation: PgModelStorageSyncImpl,
    dependencies: [KnexClient, PgSchema, ScopeRegistry, SearchIndexer]
});
