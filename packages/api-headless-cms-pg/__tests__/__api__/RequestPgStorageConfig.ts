import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { PgStorageConfig } from "../../src/features/config/abstractions.js";
import {
    readPgStorageSettings,
    resolvePgStorageConfig
} from "../../src/features/config/pgStorageSettings.js";

/*
 * The tests register the storage in each request's container, where build params exist, and some
 * change a setting between requests (a `PgCountCap` build param registered for the next request).
 * So the tests read the settings from the request's build params instead of fixing them when the
 * storage is registered. Request containers only: the root container has no build params.
 */
class RequestPgStorageConfigImpl implements PgStorageConfig.Interface {
    public readonly defaultIndexMode: PgStorageConfig.Interface["defaultIndexMode"];
    public readonly indexModeTtlMs: number;
    public readonly estimateTtlMs: number;
    public readonly fieldBudget: number;
    public readonly slotIndexes: boolean;
    public readonly countCap: number;
    public readonly bitmapHints: boolean;

    public constructor(buildParams: BuildParams.Interface) {
        const config = resolvePgStorageConfig(readPgStorageSettings(buildParams));
        this.defaultIndexMode = config.defaultIndexMode;
        this.indexModeTtlMs = config.indexModeTtlMs;
        this.estimateTtlMs = config.estimateTtlMs;
        this.fieldBudget = config.fieldBudget;
        this.slotIndexes = config.slotIndexes;
        this.countCap = config.countCap;
        this.bitmapHints = config.bitmapHints;
    }
}

export const RequestPgStorageConfig = PgStorageConfig.createImplementation({
    implementation: RequestPgStorageConfigImpl,
    dependencies: [BuildParams]
});
