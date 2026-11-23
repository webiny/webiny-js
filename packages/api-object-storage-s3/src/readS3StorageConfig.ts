import type { S3StorageConfig } from "./abstractions.js";

type Env = Record<string, string | undefined>;

function read(env: Env, name: string): string {
    return env[name]?.trim() ?? "";
}

/* An absolute http(s) URL with a host name, so the first S3 call doesn't fail on it instead. */
function isHttpUrl(value: string): boolean {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return false;
    }
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "";
}

/*
 * The prefix as the storage uses it: empty, or ending in exactly one `/`. A leading `/` would make
 * an object key that starts with an empty segment.
 */
function normalizePrefix(prefix: string): string {
    const trimmed = prefix.replace(/\/+$/, "");
    return trimmed ? `${trimmed}/` : "";
}

/**
 * The bucket from the `WEBINY_S3_*` env vars. Throws one error naming every missing or invalid
 * variable. Nothing is baked into the build: `webiny watch` and `webiny serve` get the values from
 * `<Infra.S3Storage />`, and a deployed container sets them itself.
 */
export function readS3StorageConfig(env: Env): S3StorageConfig.Interface {
    const problems: string[] = [];

    const bucket = read(env, "WEBINY_S3_BUCKET");
    if (!bucket) {
        problems.push("WEBINY_S3_BUCKET is not set.");
    }

    // AWS_REGION is what the SDK reads by itself, and what AWS sets in ECS and Lambda.
    const region = read(env, "WEBINY_S3_REGION") || read(env, "AWS_REGION");
    if (!region) {
        problems.push('WEBINY_S3_REGION is not set ("auto" for Cloudflare R2).');
    }

    const endpoint = read(env, "WEBINY_S3_ENDPOINT");
    if (endpoint && !isHttpUrl(endpoint)) {
        problems.push(`WEBINY_S3_ENDPOINT is not an http(s) URL: "${endpoint}".`);
    }

    const forcePathStyle = read(env, "WEBINY_S3_FORCE_PATH_STYLE");
    if (forcePathStyle && forcePathStyle !== "true" && forcePathStyle !== "false") {
        problems.push(`WEBINY_S3_FORCE_PATH_STYLE must be "true" or "false": "${forcePathStyle}".`);
    }

    const prefix = read(env, "WEBINY_S3_PREFIX");
    if (prefix.startsWith("/")) {
        problems.push(`WEBINY_S3_PREFIX must not start with "/": "${prefix}".`);
    }

    // Secrets are used exactly as given: trimming would change them.
    const accessKeyId = read(env, "WEBINY_S3_ACCESS_KEY_ID");
    const secretAccessKeyValue = env["WEBINY_S3_SECRET_ACCESS_KEY"] ?? "";
    let secretAccessKey = "";
    if (secretAccessKeyValue.trim()) {
        secretAccessKey = secretAccessKeyValue;
    }
    if (!!accessKeyId !== !!secretAccessKey) {
        problems.push(
            "Set both WEBINY_S3_ACCESS_KEY_ID and WEBINY_S3_SECRET_ACCESS_KEY, or neither."
        );
    }

    if (problems.length > 0) {
        const message = ["The S3 object storage is misconfigured:", ...problems].join("\n  ");
        throw new Error(message);
    }

    let credentials: S3StorageConfig.Interface["credentials"];
    if (accessKeyId) {
        credentials = { accessKeyId, secretAccessKey };
    }

    return {
        bucket,
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: forcePathStyle === "true",
        prefix: normalizePrefix(prefix),
        credentials
    };
}
