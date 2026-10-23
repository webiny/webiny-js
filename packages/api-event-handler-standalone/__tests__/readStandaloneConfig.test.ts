import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import nodePath from "node:path";
import { Container } from "@webiny/feature/api";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrlsFeature } from "@webiny/api-core/features/publicUrls/index.js";
import { readStandaloneConfig } from "~/config/readStandaloneConfig.js";
import { StandaloneConfig } from "~/config/abstractions.js";
import { ConfigPublicUrlsFeature } from "~/publicUrls/feature.js";

const validEnv = {
    WEBINY_API_URL: "https://api.staging.example.com/",
    WEBINY_ADMIN_URL: "https://admin.staging.example.com",
    WEBINY_LOCAL_STORAGE_PATH: "data/storage",
    WEBINY_UPLOAD_SECRET: "staging-upload-secret"
};

describe("readStandaloneConfig", () => {
    it("reads every setting from env", () => {
        const config = readStandaloneConfig(validEnv);

        expect(config.apiUrl.toString()).toBe("https://api.staging.example.com");
        expect(config.adminUrl.toString()).toBe("https://admin.staging.example.com");
        expect(config.fileStorage).toEqual({
            storagePath: nodePath.resolve("data/storage"),
            uploadSecret: "staging-upload-secret"
        });
    });

    it("keeps secrets exactly as given, so derived keys and signatures match", () => {
        const config = readStandaloneConfig({
            ...validEnv,
            WEBINY_UPLOAD_SECRET: " upload secret ",
            WEBINY_ENCRYPTION_PASSPHRASE: " passphrase ",
            WEBINY_HASHING_PEPPER: "pepper\n"
        });

        expect(config.fileStorage.uploadSecret).toBe(" upload secret ");
        expect(config.encryption.passphrase).toBe(" passphrase ");
        expect(config.hashing.pepper).toBe("pepper\n");
    });

    it("treats a missing Admin URL as unknown", () => {
        const config = readStandaloneConfig({ ...validEnv, WEBINY_ADMIN_URL: undefined });

        expect(config.adminUrl.isKnown()).toBe(false);
    });

    it("names every missing or blank required variable in one error", () => {
        expect(() => readStandaloneConfig({ WEBINY_UPLOAD_SECRET: "   " })).toThrowError(
            [
                "The standalone API is missing required configuration:",
                "WEBINY_API_URL is not set.",
                "WEBINY_LOCAL_STORAGE_PATH is not set.",
                "WEBINY_UPLOAD_SECRET is not set."
            ].join("\n  ")
        );
    });

    it("rejects URLs that are not absolute http(s) URLs", () => {
        expect(() =>
            readStandaloneConfig({
                ...validEnv,
                WEBINY_API_URL: "api.example.com",
                WEBINY_ADMIN_URL: "ftp://admin.example.com"
            })
        ).toThrowError(
            [
                "The standalone API is missing required configuration:",
                'WEBINY_API_URL is not an absolute http(s) URL: "api.example.com".',
                'WEBINY_ADMIN_URL is not an absolute http(s) URL: "ftp://admin.example.com".'
            ].join("\n  ")
        );
    });
});

describe("ConfigPublicUrls", () => {
    it("returns the URLs from the standalone config", async () => {
        const container = new Container();
        container.registerInstance(StandaloneConfig, readStandaloneConfig(validEnv));
        PublicUrlsFeature.register(container);
        ConfigPublicUrlsFeature.register(container);

        const publicUrls = container.resolve(PublicUrls);
        const apiUrl = await publicUrls.getApiUrl();
        const adminUrl = await publicUrls.getAdminUrl();

        expect(apiUrl.toString()).toBe("https://api.staging.example.com");
        expect(adminUrl.toString()).toBe("https://admin.staging.example.com");
    });
});
