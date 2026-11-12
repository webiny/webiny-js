import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import {
    PG_BUILD_PARAMS,
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
    bitmapHints: settings.bitmapHints ?? true
});

/*
 * The config as a DI implementation of fixed settings. A class registration, not an instance, so a
 * later registration (a test reading each request's build params) can replace it: the container
 * prefers instances over classes whatever the order.
 */
export const createPgStorageConfig = (settings: IPgStorageSettings = {}) => {
    const config = resolvePgStorageConfig(settings);

    class FixedPgStorageConfigImpl implements PgStorageConfig.Interface {
        public readonly defaultIndexMode = config.defaultIndexMode;
        public readonly indexModeTtlMs = config.indexModeTtlMs;
        public readonly estimateTtlMs = config.estimateTtlMs;
        public readonly fieldBudget = config.fieldBudget;
        public readonly slotIndexes = config.slotIndexes;
        public readonly countCap = config.countCap;
        public readonly bitmapHints = config.bitmapHints;
    }

    return PgStorageConfig.createImplementation({
        implementation: FixedPgStorageConfigImpl,
        dependencies: []
    });
};

type RawValue = string | number | boolean | null;

/* A number at least `min`, from a number or a numeric string; undefined when unset or invalid. */
const toNumber = (value: RawValue, min: number, integer = false): number | undefined => {
    if (value === null || value === "" || typeof value === "boolean") {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || (integer && !Number.isInteger(number))) {
        return undefined;
    }
    return number;
};

/* true or false from a boolean or "true"/"false"; undefined otherwise. */
const toBoolean = (value: RawValue): boolean | undefined => {
    if (value === true || value === "true") {
        return true;
    }
    if (value === false || value === "false") {
        return false;
    }
    return undefined;
};

/**
 * The storage's settings from the API's build params (the `Pg*` params `<Infra.Postgres cmsStorage>`
 * or `<Api.BuildParam>` declare). For the handler that registers the storage: it reads the build
 * params and passes the result to `HeadlessCmsPgFeature.register()` as `settings`. Invalid values
 * are left out, so the default applies.
 */
export const readPgStorageSettings = (buildParams: BuildParams.Interface): IPgStorageSettings => {
    const get = (key: string): RawValue => buildParams.get<RawValue>(key);
    const indexMode = get(PG_BUILD_PARAMS.indexMode);
    return {
        defaultIndexMode: indexMode === "lean" || indexMode === "indexed" ? indexMode : undefined,
        indexModeTtlMs: toNumber(get(PG_BUILD_PARAMS.indexModeTtlMs), 0),
        estimateTtlMs: toNumber(get(PG_BUILD_PARAMS.estimateTtlMs), 0),
        fieldBudget: toNumber(get(PG_BUILD_PARAMS.fieldBudget), 0),
        slotIndexes: toBoolean(get(PG_BUILD_PARAMS.slotIndexes)),
        countCap: toNumber(get(PG_BUILD_PARAMS.countCap), 1, true),
        bitmapHints: toBoolean(get(PG_BUILD_PARAMS.bitmapHints)),
        sharedTables: toBoolean(get(PG_BUILD_PARAMS.sharedTables))
    };
};
