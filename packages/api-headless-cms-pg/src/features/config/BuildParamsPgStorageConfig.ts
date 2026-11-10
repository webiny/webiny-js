import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { PG_BUILD_PARAMS, PgStorageConfig } from "./abstractions.js";

export const DEFAULT_INDEX_MODE_TTL_MS = 30_000;
export const DEFAULT_ESTIMATE_TTL_MS = 60_000;
export const DEFAULT_FIELD_BUDGET = 50;
export const DEFAULT_COUNT_CAP = 10_000;

type RawValue = string | number | boolean | null;

/* A number at least `min`, from a number or a numeric string; null when unset or invalid. */
const toNumber = (value: RawValue, min: number, integer = false): number | null => {
    if (value === null || value === "" || typeof value === "boolean") {
        return null;
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || (integer && !Number.isInteger(number))) {
        return null;
    }
    return number;
};

const isFalse = (value: RawValue): boolean => value === false || value === "false";
const isTrue = (value: RawValue): boolean => value === true || value === "true";

class BuildParamsPgStorageConfigImpl implements PgStorageConfig.Interface {
    public readonly defaultIndexMode: "lean" | "indexed";
    public readonly indexModeTtlMs: number;
    public readonly estimateTtlMs: number;
    public readonly fieldBudget: number;
    public readonly slotIndexes: boolean;
    public readonly countCap: number;
    public readonly bitmapHints: boolean;

    public constructor(buildParams: BuildParams.Interface) {
        const get = (key: string): RawValue => buildParams.get<RawValue>(key);
        this.defaultIndexMode = get(PG_BUILD_PARAMS.indexMode) === "lean" ? "lean" : "indexed";
        this.indexModeTtlMs =
            toNumber(get(PG_BUILD_PARAMS.indexModeTtlMs), 0) ?? DEFAULT_INDEX_MODE_TTL_MS;
        this.estimateTtlMs =
            toNumber(get(PG_BUILD_PARAMS.estimateTtlMs), 0) ?? DEFAULT_ESTIMATE_TTL_MS;
        this.fieldBudget = toNumber(get(PG_BUILD_PARAMS.fieldBudget), 0) ?? DEFAULT_FIELD_BUDGET;
        this.slotIndexes = !isFalse(get(PG_BUILD_PARAMS.slotIndexes));
        this.countCap = toNumber(get(PG_BUILD_PARAMS.countCap), 1, true) ?? DEFAULT_COUNT_CAP;
        this.bitmapHints = !isFalse(get(PG_BUILD_PARAMS.bitmapHints));
    }
}

export const BuildParamsPgStorageConfig = PgStorageConfig.createImplementation({
    implementation: BuildParamsPgStorageConfigImpl,
    dependencies: [BuildParams]
});

/* Whether all tenants share one table set (`CmsSharedTables`). */
export const readSharedTables = (buildParams: BuildParams.Interface): boolean =>
    isTrue(buildParams.get<RawValue>(PG_BUILD_PARAMS.sharedTables));
