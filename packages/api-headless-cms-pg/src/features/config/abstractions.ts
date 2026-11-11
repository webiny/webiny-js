import { createAbstraction } from "@webiny/feature/api/index.js";

/**
 * Build param names of the Postgres CMS storage settings. Set them with `<Api.BuildParam>`, or
 * through the `<Infra.Postgres>` extension's props; `readPgStorageSettings()` reads them.
 */
export const PG_BUILD_PARAMS = {
    /* "lean" or "indexed": the index mode of new scopes. */
    indexMode: "PgIndexMode",
    /* Milliseconds a process may use a cached scope mode for queries. */
    indexModeTtlMs: "PgIndexModeTtlMs",
    /* Milliseconds a row estimate is kept; 0 turns the estimate cache off. */
    estimateTtlMs: "PgEstimateTtlMs",
    /* Slot columns one model's own fields may use. */
    fieldBudget: "PgFieldBudget",
    /* false skips the per-slot btree indexes (test runs). */
    slotIndexes: "PgSlotIndexes",
    /* Matches a list counts exactly; above it the total is the cap. */
    countCap: "PgCountCap",
    /* false leaves the planner settings alone when collecting matches (RDS Proxy pinning). */
    bitmapHints: "PgBitmapHints",
    /* true: all tenants share one table set. */
    sharedTables: "CmsSharedTables"
} as const;

export interface IPgStorageConfig {
    /**
     * The mode of new scopes. A cluster for small accounts runs `lean` and promotes big models; a
     * cluster for large accounts runs `indexed`.
     */
    readonly defaultIndexMode: "lean" | "indexed";
    /**
     * How long a process may use a cached scope mode for queries. Demotion waits longer than this
     * before unflagging rows, so no process still adds `ix` for the scope by then.
     */
    readonly indexModeTtlMs: number;
    /* How long a row estimate is kept (see estimateCache); 0 turns the cache off. */
    readonly estimateTtlMs: number;
    /*
     * How many slot columns a single model's own fields may use, across all families (system
     * fields are always slotted and do not count). Fields beyond the budget go to the `ov`
     * overflow column.
     */
    readonly fieldBudget: number;
    /* Whether the schema creates one partial btree per scalar slot. They affect speed, never results. */
    readonly slotIndexes: boolean;
    /* Totals are exact up to this many matches (see readListPage). */
    readonly countCap: number;
    /* Whether matches are collected with bitmap-only planner settings (see readListPage). */
    readonly bitmapHints: boolean;
}

/**
 * The storage's settings as `HeadlessCmsPgFeature.register()` takes them: each one optional, unset
 * means the default. `readPgStorageSettings()` reads them from the API's build params.
 */
export interface IPgStorageSettings extends Partial<IPgStorageConfig> {
    /* true: all tenants share one table set. */
    readonly sharedTables?: boolean;
}

/** Settings of the Postgres CMS storage, as passed to `HeadlessCmsPgFeature.register()`. */
export const PgStorageConfig = createAbstraction<IPgStorageConfig>("Cms/Pg/StorageConfig");

export namespace PgStorageConfig {
    export type Interface = IPgStorageConfig;
    export type Settings = IPgStorageSettings;
}
