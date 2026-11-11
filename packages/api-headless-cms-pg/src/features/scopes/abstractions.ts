import { createAbstraction } from "@webiny/feature/api/index.js";
import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { IIndexPlan } from "~/features/indexPlan/createIndexPlan.js";
import type { IndexMode } from "~/features/indexMode/indexMode.js";

/*
 * Work the rows of a key still need (see the model changes spec, §4):
 * - "filling": a new sortable slot on a scope with rows; old rows lack its null token.
 * - "reindex": old rows may lack this key's values, or hold them built with other search settings.
 * A key without a state is ready.
 */
export type SlotState = "filling" | "reindex";

/* An assignment of a key that left the model (or changed family): its column and tokens still sit in old rows. */
export interface IRetiredSlot {
    key: string;
    slot?: string;
    overflow?: true;
}

export interface IScopeSlotMap {
    /*
     * 2: keyed by storage key ("values.text@k3j9x"), as stored. Without it, a map stored before
     * keyed by value path. The scope handed to readers is keyed by value path (see get()).
     */
    version?: 2;
    /* Key -> slot column, e.g. { "values.text@title": "t22" }. */
    slots: Record<string, string>;
    /* Text key -> full-text key used in lexemes, e.g. "f3". Never reused: kept for removed keys. */
    ft: Record<string, string>;
    /* Searchable-json key -> key in the `sj` column and in `tok` tokens, e.g. "j1". Never reused. */
    json: Record<string, string>;
    /* Keys over the field budget: values live in the `ov` jsonb column, equality still uses `tok`. */
    overflow: Record<string, true>;
    /* Value path -> why it is not filterable ("cap", "capacity" or the unsupported field type). */
    unindexed: Record<string, string>;
    /* Key -> pending work; absent when ready. */
    state?: Record<string, SlotState>;
    /* Key -> search settings (text mode, phrases) the existing rows were built with. */
    settings?: Record<string, string>;
    /* Assignments waiting for their column and tokens to be cleared; their slots stay taken. */
    retired?: IRetiredSlot[];
    /* Keys whose slot was released after they left the model; one coming back may have data. */
    gone?: Record<string, true>;
}

export interface IScope {
    scopeId: number;
    /* The model's plan, as writes use it. */
    plan: IIndexPlan;
    /*
     * The plan as queries should read it: while a field's rows are rebuilt for new search settings,
     * only the settings both old and new rows satisfy (see readPlanOf in ScopeRegistry).
     */
    readPlan: IIndexPlan;
    /* The stored map as readers use it: by value path, with each path's state. */
    slotMap: IScopeSlotMap;
    /* The map as stored, by storage key: for the background sync. */
    stored: IScopeSlotMap;
    /* For queries only: up to the mode TTL old. Writes read the mode in their own transaction. */
    indexMode: IndexMode;
    /* Whether any key has work left (a state, a retired assignment): see ModelStorageSync. */
    pending: boolean;
}

export interface IScopeRegistry {
    get(model: CmsModel, db?: Knex): Promise<IScope>;
    /* Changes the stored map under the scope row's lock (the background sync, when work is done). */
    update(model: CmsModel, change: (stored: IScopeSlotMap) => IScopeSlotMap): Promise<void>;
    /*
     * After the model was deleted: removes what the scope holds (search rows, value counts) and
     * resets its slot map and index mode, so a model created under the same id starts clean. The
     * scope row and its id stay, so processes that still cache the scope keep a valid id.
     */
    clear(model: CmsModel): Promise<void>;
    /* Drops the cached scope of a model, e.g. after its index mode changed. */
    forget(model: CmsModel): void;
    reset(): void;
}

export const ScopeRegistry = createAbstraction<IScopeRegistry>("Cms/Pg/ScopeRegistry");

export namespace ScopeRegistry {
    export type Interface = IScopeRegistry;
    export type Scope = IScope;
    export type SlotMap = IScopeSlotMap;
    export type RetiredSlot = IRetiredSlot;
}
