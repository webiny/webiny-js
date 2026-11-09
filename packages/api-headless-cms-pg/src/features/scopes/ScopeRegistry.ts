import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { KnexClient } from "@webiny/api-core-sql";
import { CmsEntrySystemField } from "@webiny/api-headless-cms/features/contentEntry/EntrySystemField/index.js";
import {
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry
} from "@webiny/api-headless-cms-storage";
import { ScopeRegistry as Abstraction } from "./abstractions.js";
import { allocateSlots, settingsOf } from "./allocateSlots.js";
import { scopeCache, scopeCacheKey } from "./scopeCache.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { createIndexPlan } from "~/features/indexPlan/createIndexPlan.js";
import type { IIndexPlan } from "~/features/indexPlan/createIndexPlan.js";
import type { IndexMode } from "~/features/indexMode/indexMode.js";
import { getDefaultIndexMode, getModeTtlMs } from "~/features/indexMode/indexMode.js";

const EMPTY_SLOT_MAP: Abstraction.SlotMap = {
    slots: {},
    ft: {},
    json: {},
    overflow: {},
    unindexed: {}
};

const KINDS = ["slots", "ft", "json", "overflow"] as const;

/*
 * A map stored before slot maps were keyed by storage key: re-key every assignment whose path is
 * still planned and mark it for a rebuild (old rows name overflow values and tokens by path); keep
 * the others under "v1:<path>", so they are retired and their columns cleared. Returns null when
 * the map is already keyed by storage key.
 */
const fromVersion1 = (
    plan: IIndexPlan,
    stored: Abstraction.SlotMap
): Abstraction.SlotMap | null => {
    if (stored.version === 2) {
        return null;
    }
    const keyOf = new Map(Object.values(plan.paths).map(entry => [entry.path, entry.key]));
    const converted: Abstraction.SlotMap = { ...EMPTY_SLOT_MAP, version: 2, state: {} };
    for (const kind of KINDS) {
        const target: Record<string, unknown> = {};
        for (const [path, value] of Object.entries(stored[kind] || {})) {
            const key = keyOf.get(path);
            target[key ?? `v1:${path}`] = value;
            if (key) {
                converted.state![key] = "reindex";
            }
        }
        (converted as unknown as Record<string, unknown>)[kind] = target;
    }
    return converted;
};

/* The stored map (by storage key) as readers use it: by the plan's value paths. */
const byPath = (plan: IIndexPlan, stored: Abstraction.SlotMap): Abstraction.SlotMap => {
    const view: Abstraction.SlotMap = {
        slots: {},
        ft: {},
        json: {},
        overflow: {},
        unindexed: stored.unindexed,
        state: {}
    };
    for (const entry of Object.values(plan.paths)) {
        for (const kind of KINDS) {
            const value = stored[kind][entry.key];
            if (value !== undefined) {
                (view[kind] as Record<string, unknown>)[entry.path] = value;
            }
        }
        const state = stored.state?.[entry.key];
        if (state) {
            view.state![entry.path] = state;
        }
    }
    return view;
};

/*
 * The plan as queries read it. While a key's rows are rebuilt for new search settings, old rows
 * have the old lexemes and new rows the new ones, so a query uses only what both have: substrings
 * and phrases only when both settings have them.
 */
const readPlanOf = (plan: IIndexPlan, stored: Abstraction.SlotMap): IIndexPlan => {
    let paths: IIndexPlan["paths"] | null = null;
    for (const entry of Object.values(plan.paths)) {
        const old = stored.settings?.[entry.key];
        if (stored.state?.[entry.key] !== "reindex" || !old || old === settingsOf(entry)) {
            continue;
        }
        paths = paths || { ...plan.paths };
        paths[entry.path] = {
            ...entry,
            substrings: entry.substrings === true && old[0] === "s",
            phrases: entry.phrases === true && old[1] === "p"
        };
    }
    return paths ? { ...plan, paths } : plan;
};

/* Runs `callback` once the outermost transaction of `trx` has committed; not at all if it rolls back. */
const afterCommit = (trx: Knex.Transaction, callback: () => void): void => {
    let outermost = trx;
    while (outermost.parentTransaction) {
        outermost = outermost.parentTransaction;
    }
    outermost.executionPromise.then(callback, () => {
        // Rolled back: nothing to cache.
    });
};

const hasPending = (stored: Abstraction.SlotMap): boolean =>
    Object.keys(stored.state || {}).length > 0 || (stored.retired || []).length > 0;

class ScopeRegistryImpl implements Abstraction.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly pathRegistry: FieldFilterPathRegistry.Interface,
        private readonly transformRegistry: FieldFilterValueTransformRegistry.Interface,
        private readonly entrySystemFields: CmsEntrySystemField.Interface[]
    ) {}

    public reset(): void {
        scopeCache.clear();
    }

    public forget(model: CmsModel): void {
        scopeCache.delete(
            scopeCacheKey(this.schema.getTables().scopes, model.tenant, model.modelId)
        );
    }

    public async get(model: CmsModel, db?: Knex): Promise<Abstraction.Scope> {
        await this.schema.ensure();
        const plan = createIndexPlan({
            model,
            systemFields: this.entrySystemFields.map(systemField => systemField.field),
            pathRegistry: this.pathRegistry,
            transformRegistry: this.transformRegistry
        });
        const { scopes } = this.schema.getTables();
        const key = scopeCacheKey(scopes, model.tenant, model.modelId);

        const cached = scopeCache.get(key);
        if (cached) {
            if (Date.now() - cached.modeReadAt > getModeTtlMs()) {
                // The mode changes, and so does pending work (the background sync clears it).
                const result = await (db || this.knex.client).raw(
                    `SELECT index_mode, slot_map FROM "${scopes}" WHERE scope_id = ?`,
                    [cached.scopeId]
                );
                cached.indexMode = result.rows[0].index_mode;
                cached.slotMap = { ...EMPTY_SLOT_MAP, ...result.rows[0].slot_map };
                cached.modeReadAt = Date.now();
            }
            const { slotMap, changed } = allocateSlots(plan, cached.slotMap);
            if (!changed) {
                return this.scope(cached.scopeId, plan, slotMap, cached.indexMode);
            }
        }

        const run = async (trx: Knex.Transaction): Promise<Abstraction.Scope> => {
            const row = await this.lockScope(trx, model);
            const stored: Abstraction.SlotMap = { ...EMPTY_SLOT_MAP, ...row.slot_map };
            const base = fromVersion1(plan, stored) ?? stored;
            let { slotMap, changed } = allocateSlots(plan, base);
            if (changed) {
                // Allocate again knowing whether existing rows need work for the new keys.
                const search = this.schema.getTables().search;
                const rows = await trx.raw(
                    `SELECT EXISTS (SELECT 1 FROM "${search}" WHERE scope_id = ?) AS has_rows`,
                    [row.scope_id]
                );
                ({ slotMap, changed } = allocateSlots(plan, base, {
                    hasRows: rows.rows[0].has_rows === true,
                    codeModel: model.isPlugin === true
                }));
                await this.store(trx, row.scope_id, slotMap);
            }
            /*
             * Cached only once the transaction has committed: a rolled-back one (an error later in
             * an entry write, or a COMMIT lost to a failover and run again) may have inserted the
             * scope row or changed the slot map, and caching that would hand later requests a scope
             * id or slots that don't exist.
             */
            afterCommit(trx, () => {
                scopeCache.set(key, {
                    scopeId: row.scope_id,
                    slotMap,
                    indexMode: row.index_mode,
                    modeReadAt: Date.now()
                });
            });
            return this.scope(row.scope_id, plan, slotMap, row.index_mode);
        };

        if (db && (db as Knex.Transaction).isTransaction) {
            return run(db as Knex.Transaction);
        }
        return this.knex.client.transaction(run);
    }

    public async update(
        model: CmsModel,
        change: (stored: Abstraction.SlotMap) => Abstraction.SlotMap
    ): Promise<void> {
        await this.schema.ensure();
        await this.knex.client.transaction(async trx => {
            const row = await this.lockScope(trx, model);
            const stored: Abstraction.SlotMap = { ...EMPTY_SLOT_MAP, ...row.slot_map };
            await this.store(trx, row.scope_id, change(stored));
        });
        this.forget(model);
    }

    public async clear(model: CmsModel): Promise<void> {
        await this.schema.ensure();
        const { scopes, search, values, valueDeltas } = this.schema.getTables();
        await this.knex.client.transaction(async trx => {
            const result = await trx.raw(
                `SELECT scope_id FROM "${scopes}" WHERE tenant = ? AND model_id = ? FOR UPDATE`,
                [model.tenant, model.modelId]
            );
            const scopeId: number | undefined = result.rows[0]?.scope_id;
            if (scopeId === undefined) {
                return;
            }
            // Search rows first: their triggers append count deltas, removed next.
            await trx.raw(`DELETE FROM "${search}" WHERE scope_id = ?`, [scopeId]);
            await trx.raw(`DELETE FROM "${valueDeltas}" WHERE scope_id = ?`, [scopeId]);
            await trx.raw(`DELETE FROM "${values}" WHERE scope_id = ?`, [scopeId]);
            await trx.raw(
                `UPDATE "${scopes}" SET slot_map = '{}'::jsonb, index_mode = ? WHERE scope_id = ?`,
                [getDefaultIndexMode(), scopeId]
            );
        });
        this.forget(model);
    }

    private scope(
        scopeId: number,
        plan: IIndexPlan,
        stored: Abstraction.SlotMap,
        indexMode: IndexMode
    ): Abstraction.Scope {
        return {
            scopeId,
            plan,
            readPlan: readPlanOf(plan, stored),
            slotMap: byPath(plan, stored),
            stored,
            indexMode,
            pending: hasPending(stored)
        };
    }

    private async lockScope(
        trx: Knex.Transaction,
        model: CmsModel
    ): Promise<{ scope_id: number; slot_map: Abstraction.SlotMap; index_mode: IndexMode }> {
        const { scopes } = this.schema.getTables();
        await trx.raw(
            `INSERT INTO "${scopes}" (tenant, model_id, index_mode) VALUES (?, ?, ?) ON CONFLICT (tenant, model_id) DO NOTHING`,
            [model.tenant, model.modelId, getDefaultIndexMode()]
        );
        const result = await trx.raw(
            `SELECT scope_id, slot_map, index_mode FROM "${scopes}" WHERE tenant = ? AND model_id = ? FOR UPDATE`,
            [model.tenant, model.modelId]
        );
        return result.rows[0];
    }

    private async store(
        trx: Knex.Transaction,
        scopeId: number,
        slotMap: Abstraction.SlotMap
    ): Promise<void> {
        await trx.raw(
            `UPDATE "${this.schema.getTables().scopes}" SET slot_map = ? WHERE scope_id = ?`,
            [JSON.stringify(slotMap), scopeId]
        );
    }
}

export const ScopeRegistryImplementation = Abstraction.createImplementation({
    implementation: ScopeRegistryImpl,
    dependencies: [
        KnexClient,
        PgSchema,
        FieldFilterPathRegistry,
        FieldFilterValueTransformRegistry,
        [CmsEntrySystemField, { multiple: true }]
    ]
});
