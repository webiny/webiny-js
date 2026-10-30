import nodePath from "node:path";
import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import type { StandaloneConfig } from "./abstractions.js";

type Env = Record<string, string | undefined>;

function read(env: Env, name: string): string {
    return env[name]?.trim() ?? "";
}

/**
 * Secrets are used exactly as given: trimming would change the derived key or signature, so a value
 * with surrounding whitespace would no longer match what was encrypted, hashed or signed with it.
 * A blank value counts as unset.
 */
function readSecret(env: Env, name: string): string {
    const value = env[name] ?? "";
    return value.trim() ? value : "";
}

/**
 * Reads the standalone API's settings from env. Throws one error naming every missing or invalid
 * variable, so a misconfigured container fails at boot instead of on the first upload or login.
 *
 * Nothing falls back to a default: `webiny watch` and `webiny serve` get their values from
 * `<Infra.ApiUrl>`, `<Infra.AdminUrl>`, `<Infra.FileStorage>` and `<Infra.Crypto.*>` in
 * webiny.config, and a deployed container must set them explicitly.
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

    const uploadSecret = readSecret(env, "WEBINY_UPLOAD_SECRET");
    if (!uploadSecret) {
        problems.push("WEBINY_UPLOAD_SECRET is not set.");
    }

    // Always required: a standalone project always encrypts and always peppers its hashes. There is
    // no deploy step that could check this for production, so it is checked here for every start.
    const encryptionPassphrase = readSecret(env, "WEBINY_ENCRYPTION_PASSPHRASE");
    if (!encryptionPassphrase) {
        problems.push("WEBINY_ENCRYPTION_PASSPHRASE is not set.");
    }

    const hashingPepper = readSecret(env, "WEBINY_HASHING_PEPPER");
    if (!hashingPepper) {
        problems.push("WEBINY_HASHING_PEPPER is not set.");
    }

    const redisUrl = read(env, "WEBINY_REDIS_URL");
    if (redisUrl && !/^rediss?:\/\//.test(redisUrl)) {
        problems.push("WEBINY_REDIS_URL must start with redis:// or rediss://.");
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
        },
        encryption: {
            passphrase: encryptionPassphrase,
            salt: readSecret(env, "WEBINY_ENCRYPTION_SALT")
        },
        hashing: {
            pepper: hashingPepper
        },
        redisUrl: redisUrl || undefined
    };
}
