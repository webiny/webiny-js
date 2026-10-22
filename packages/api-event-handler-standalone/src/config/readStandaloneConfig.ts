import nodePath from "node:path";
import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import type { StandaloneConfig } from "./abstractions.js";

type Env = Record<string, string | undefined>;

function read(env: Env, name: string): string {
    return env[name]?.trim() ?? "";
}

/**
 * Reads the standalone API's settings from env. Throws one error naming every missing or invalid
 * variable, so a misconfigured container fails at boot instead of on the first upload or login.
 *
 * Nothing falls back to a default: `webiny watch` and `webiny serve` get their values from
 * `<Infra.ApiUrl>`, `<Infra.AdminUrl>` and `<Infra.FileStorage>` in webiny.config, and a deployed
 * container must set them explicitly.
 */
export function readStandaloneConfig(env: Env): StandaloneConfig.Interface {
    const problems: string[] = [];

    const apiUrlValue = read(env, "WEBINY_API_URL");
    const apiUrl = PublicUrl.from(apiUrlValue);
    if (!apiUrlValue) {
        problems.push("WEBINY_API_URL is not set.");
    } else if (!apiUrl.isKnown()) {
        problems.push(`WEBINY_API_URL is not an absolute http(s) URL: "${apiUrlValue}".`);
    }

    const adminUrlValue = read(env, "WEBINY_ADMIN_URL");
    const adminUrl = PublicUrl.from(adminUrlValue);
    if (adminUrlValue && !adminUrl.isKnown()) {
        problems.push(`WEBINY_ADMIN_URL is not an absolute http(s) URL: "${adminUrlValue}".`);
    }

    const storagePath = read(env, "WEBINY_LOCAL_STORAGE_PATH");
    if (!storagePath) {
        problems.push("WEBINY_LOCAL_STORAGE_PATH is not set.");
    }

    const uploadSecret = read(env, "WEBINY_UPLOAD_SECRET");
    if (!uploadSecret) {
        problems.push("WEBINY_UPLOAD_SECRET is not set.");
    }

    if (problems.length > 0) {
        throw new Error(
            ["The standalone API is missing required configuration:", ...problems].join("\n  ")
        );
    }

    return {
        apiUrl,
        adminUrl,
        fileStorage: {
            storagePath: nodePath.resolve(storagePath),
            uploadSecret
        }
    };
}
