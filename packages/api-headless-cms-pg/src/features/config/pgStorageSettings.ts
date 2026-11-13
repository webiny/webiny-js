import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import {
    PG_CMS_BUILD_PARAM,
    PG_CMS_DEFAULTS_BUILD_PARAM,
    PgStorageConfig,
    type IPgStorageConfig,
    type IPgStorageSettings
} from "./abstractions.js";

export const DEFAULT_INDEX_MODE_TTL_MS = 30_000;
export const DEFAULT_ESTIMATE_TTL_MS = 60_000;
export const DEFAULT_FIELD_BUDGET = 50;
export const DEFAULT_COUNT_CAP = 10_000;

/* The settings with the defaults applied to the ones left unset. */
export const resolvePgStorageConfig = (settings: IPgStorageSettings = {}): IPgStorageConfig => ({
    defaultIndexMode: settings.defaultIndexMode ?? "indexed",
    indexModeTtlMs: settings.indexModeTtlMs ?? DEFAULT_INDEX_MODE_TTL_MS,
    estimateTtlMs: settings.estimateTtlMs ?? DEFAULT_ESTIMATE_TTL_MS,
    fieldBudget: settings.fieldBudget ?? DEFAULT_FIELD_BUDGET,
    slotIndexes: settings.slotIndexes ?? true,
    countCap: settings.countCap ?? DEFAULT_COUNT_CAP,
    bitmapHints: settings.bitmapHints ?? true,
    sharedTables: settings.sharedTables ?? false
});

/* A number at least `min`; undefined when unset or invalid. */
const toNumber = (value: unknown, min: number, integer = false): number | undefined => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
        return undefined;
    }
    if (integer && !Number.isInteger(value)) {
        return undefined;
    }
    return value;
};

const toBoolean = (value: unknown): boolean | undefined => {
    return typeof value === "boolean" ? value : undefined;
};

/**
 * The settings in the `HeadlessCmsPg` build param. `<HeadlessCmsPg>` validates them when the
 * project is built; a value of the wrong type is left out here too, so the default applies.
 */
export const parsePgStorageSettings = (value: unknown): IPgStorageSettings => {
    if (!value || typeof value !== "object") {
        return {};
    }
    const settings = value as Record<string, unknown>;
    const indexMode = settings.defaultIndexMode;
    return {
        defaultIndexMode: indexMode === "lean" || indexMode === "indexed" ? indexMode : undefined,
        indexModeTtlMs: toNumber(settings.indexModeTtlMs, 0),
        estimateTtlMs: toNumber(settings.estimateTtlMs, 0),
        fieldBudget: toNumber(settings.fieldBudget, 0),
        slotIndexes: toBoolean(settings.slotIndexes),
        countCap: toNumber(settings.countCap, 1, true),
        bitmapHints: toBoolean(settings.bitmapHints),
        sharedTables: toBoolean(settings.sharedTables)
    };
};

/* The settings, each one taken from `defaults` when `settings` leaves it unset. */
export const withPgStorageDefaults = (
    settings: IPgStorageSettings,
    defaults: IPgStorageSettings
): IPgStorageSettings => {
    const merged: Record<string, unknown> = { ...defaults };
    for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
            merged[key] = value;
        }
    }
    return merged as IPgStorageSettings;
};

/*
 * The config from the `HeadlessCmsPg` build param of the container it's resolved in, over the
 * hosting's defaults in the `HeadlessCmsPgDefaults` build param. The module is
 * registered per request, where the build params are, and schema setup registers the build params
 * before it, so setup and requests read the same settings.
 */
class BuildParamsPgStorageConfigImpl implements PgStorageConfig.Interface {
    public readonly defaultIndexMode: PgStorageConfig.Interface["defaultIndexMode"];
    public readonly indexModeTtlMs: number;
    public readonly estimateTtlMs: number;
    public readonly fieldBudget: number;
    public readonly slotIndexes: boolean;
    public readonly countCap: number;
    public readonly bitmapHints: boolean;
    public readonly sharedTables: boolean;

    public constructor(buildParams: BuildParams.Interface) {
        const config = resolvePgStorageConfig(
            withPgStorageDefaults(
                parsePgStorageSettings(buildParams.get(PG_CMS_BUILD_PARAM)),
                parsePgStorageSettings(buildParams.get(PG_CMS_DEFAULTS_BUILD_PARAM))
            )
        );
        this.defaultIndexMode = config.defaultIndexMode;
        this.indexModeTtlMs = config.indexModeTtlMs;
        this.estimateTtlMs = config.estimateTtlMs;
        this.fieldBudget = config.fieldBudget;
        this.slotIndexes = config.slotIndexes;
        this.countCap = config.countCap;
        this.bitmapHints = config.bitmapHints;
        this.sharedTables = config.sharedTables;
    }
}

export const BuildParamsPgStorageConfig = PgStorageConfig.createImplementation({
    implementation: BuildParamsPgStorageConfigImpl,
    dependencies: [BuildParams]
});
