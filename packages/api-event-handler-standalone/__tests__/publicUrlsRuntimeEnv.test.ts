import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeEach } from "vitest";
import { afterEach } from "vitest";
import nodePath from "node:path";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrlsFeature } from "@webiny/api-core/features/publicUrls/index.js";
import { BuildParamsPublicUrlsFeature } from "~/publicUrls/feature.js";
import { RuntimeEnvBuildParamsDecorator } from "~/buildParams/RuntimeEnvBuildParamsDecorator.js";

const ENV_VARS = [
    "WEBINY_API_URL",
    "WEBINY_ADMIN_URL",
    "WEBINY_LOCAL_STORAGE_PATH",
    "WEBINY_UPLOAD_SECRET",
    "WEBINY_SELF_HOSTED_AUTH_SECRET"
];

/** A root with the decorator and a child with the baked build params, like the real handler. */
const createRequestContainer = (baked: Record<string, unknown>) => {
    const root = new Container();
    root.registerDecorator(RuntimeEnvBuildParamsDecorator);

    const child = root.createChildContainer();
    child.registerInstance(BuildParams, {
        get: <T>(key: string) => (baked[key] ?? null) as T | null
    });
    PublicUrlsFeature.register(child);
    BuildParamsPublicUrlsFeature.register(child);
    return child;
};

describe("standalone public URLs and runtime env", () => {
    let originalEnv: Record<string, string | undefined>;

    beforeEach(() => {
        originalEnv = Object.fromEntries(ENV_VARS.map(name => [name, process.env[name]]));
        ENV_VARS.forEach(name => delete process.env[name]);
    });

    afterEach(() => {
        for (const [name, value] of Object.entries(originalEnv)) {
            if (value === undefined) {
                delete process.env[name];
            } else {
                process.env[name] = value;
            }
        }
    });

    it("uses the baked-in build params when no env is set", async () => {
        const container = createRequestContainer({
            WEBINY_API_URL: "http://localhost:3002",
            WEBINY_ADMIN_URL: "http://localhost:3001"
        });

        const publicUrls = container.resolve(PublicUrls);

        expect((await publicUrls.getApiUrl()).toString()).toBe("http://localhost:3002");
        expect((await publicUrls.getAdminUrl()).toString()).toBe("http://localhost:3001");
    });

    it("lets runtime env move the same build to another domain", async () => {
        process.env.WEBINY_API_URL = "https://api.staging.example.com";
        process.env.WEBINY_ADMIN_URL = "https://admin.staging.example.com";

        const container = createRequestContainer({
            WEBINY_API_URL: "http://localhost:3002",
            WEBINY_ADMIN_URL: "http://localhost:3001"
        });

        const publicUrls = container.resolve(PublicUrls);

        expect((await publicUrls.getApiUrl()).toString()).toBe("https://api.staging.example.com");
        expect((await publicUrls.getAdminUrl()).toString()).toBe(
            "https://admin.staging.example.com"
        );
    });

    it("overrides secrets and resolves a relative storage path against the cwd", () => {
        process.env.WEBINY_UPLOAD_SECRET = "prod-upload-secret";
        process.env.WEBINY_SELF_HOSTED_AUTH_SECRET = "prod-auth-secret";
        process.env.WEBINY_LOCAL_STORAGE_PATH = "data/storage";

        const buildParams = createRequestContainer({
            WEBINY_UPLOAD_SECRET: "dev-only-insecure-upload-secret",
            SelfHostedAuthSigningSecret: "dev-only-insecure-secret"
        }).resolve(BuildParams);

        expect(buildParams.get("WEBINY_UPLOAD_SECRET")).toBe("prod-upload-secret");
        expect(buildParams.get("SelfHostedAuthSigningSecret")).toBe("prod-auth-secret");
        expect(buildParams.get("WEBINY_LOCAL_STORAGE_PATH")).toBe(nodePath.resolve("data/storage"));
    });

    it("ignores blank env and leaves other build params alone", () => {
        process.env.WEBINY_UPLOAD_SECRET = "   ";

        const buildParams = createRequestContainer({
            WEBINY_UPLOAD_SECRET: "baked",
            FeatureFlags: { a: true }
        }).resolve(BuildParams);

        expect(buildParams.get("WEBINY_UPLOAD_SECRET")).toBe("baked");
        expect(buildParams.get("FeatureFlags")).toEqual({ a: true });
    });
});
