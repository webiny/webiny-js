import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import {
    PG_CMS_BUILD_PARAM,
    PG_CMS_DEFAULTS_BUILD_PARAM,
    PgStorageConfig
} from "~/features/config/abstractions.js";
import { BuildParamsPgStorageConfig } from "~/features/config/pgStorageSettings.js";

/* The CMS storage config as the API resolves it, from the given build params. */
const resolveConfig = (params: Record<string, unknown>) => {
    const container = new Container();
    container.registerInstance(BuildParams, {
        get: (key: string) => (key in params ? params[key] : null)
    });
    container.register(BuildParamsPgStorageConfig);
    return container.resolve(PgStorageConfig);
};

describe("bitmapHints in the CMS storage config", () => {
    it("reads the defaults from the build param `<Infra.RdsProxy enabled />` sets", () => {
        // `@webiny/project-aws` sets it by this name (`HEADLESS_CMS_PG_DEFAULTS_BUILD_PARAM`).
        expect(PG_CMS_DEFAULTS_BUILD_PARAM).toBe("HeadlessCmsPgDefaults");
    });

    it("is on when nothing sets it", () => {
        expect(resolveConfig({}).bitmapHints).toBe(true);
        expect(resolveConfig({ [PG_CMS_BUILD_PARAM]: { countCap: 500 } }).bitmapHints).toBe(true);
    });

    it("is off behind RDS Proxy, whose default turns it off", () => {
        const config = resolveConfig({
            [PG_CMS_BUILD_PARAM]: { countCap: 500 },
            [PG_CMS_DEFAULTS_BUILD_PARAM]: { bitmapHints: false }
        });

        expect(config.bitmapHints).toBe(false);
        // The project's other settings still apply.
        expect(config.countCap).toBe(500);
    });

    it("is off behind RDS Proxy also without <HeadlessCmsPg> settings", () => {
        const config = resolveConfig({ [PG_CMS_DEFAULTS_BUILD_PARAM]: { bitmapHints: false } });

        expect(config.bitmapHints).toBe(false);
    });

    it("follows an explicit <HeadlessCmsPg bitmapHints> over the proxy's default", () => {
        const config = resolveConfig({
            [PG_CMS_BUILD_PARAM]: { bitmapHints: true },
            [PG_CMS_DEFAULTS_BUILD_PARAM]: { bitmapHints: false }
        });

        expect(config.bitmapHints).toBe(true);
    });
});
