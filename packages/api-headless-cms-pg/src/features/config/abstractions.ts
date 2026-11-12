import { createAbstraction } from "@webiny/feature/api/index.js";

/**
 * The build param that holds the settings of the Postgres CMS storage, as one object
 * (`IPgStorageSettings`). `<HeadlessCmsPg>` in `webiny.config.tsx` sets it; `PgStorageConfig` reads
 * it. No other part of the API reads it.
 */
export const PG_CMS_BUILD_PARAM = "HeadlessCmsPg";

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
    /* true: all tenants share one table set. */
    readonly sharedTables: boolean;
}

/**
 * The storage's settings as the `HeadlessCmsPg` build param holds them: each one optional, unset
 * means the default.
 */
export type IPgStorageSettings = Partial<IPgStorageConfig>;

/** Settings of the Postgres CMS storage, read from the `HeadlessCmsPg` build param. */
export const PgStorageConfig = createAbstraction<IPgStorageConfig>("Cms/Pg/StorageConfig");

export namespace PgStorageConfig {
    export type Interface = IPgStorageConfig;
    export type Settings = IPgStorageSettings;
}
