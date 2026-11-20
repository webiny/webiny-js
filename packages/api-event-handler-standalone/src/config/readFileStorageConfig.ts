import nodePath from "node:path";
import type { FileManagerStandaloneConfig } from "@webiny/api-file-manager-standalone/features/FileManagerStandaloneConfig/abstractions.js";

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
 * Where uploaded files are kept. `WEBINY_S3_BUCKET` selects an S3-compatible bucket, otherwise
 * `WEBINY_LOCAL_STORAGE_PATH` a folder on disk; exactly one of the two must be set. Every problem
 * found is appended to `problems`, and `undefined` returned when there is one.
 */
export function readFileStorageConfig(
    env: Env,
    problems: string[]
): FileManagerStandaloneConfig.Storage | undefined {
    const storagePath = read(env, "WEBINY_LOCAL_STORAGE_PATH");
    const bucket = read(env, "WEBINY_S3_BUCKET");

    if (storagePath && bucket) {
        problems.push("Set WEBINY_LOCAL_STORAGE_PATH or WEBINY_S3_BUCKET, not both.");
        return undefined;
    }

    if (!bucket) {
        if (!storagePath) {
            problems.push("WEBINY_LOCAL_STORAGE_PATH is not set.");
            return undefined;
        }
        return { type: "disk", path: nodePath.resolve(storagePath) };
    }

    const startCount = problems.length;

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

    // Secrets are used exactly as given, like every other secret here.
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

    if (problems.length > startCount) {
        return undefined;
    }

    let credentials: FileManagerStandaloneConfig.S3Storage["credentials"];
    if (accessKeyId) {
        credentials = { accessKeyId, secretAccessKey };
    }

    return {
        type: "s3",
        bucket,
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: forcePathStyle === "true",
        prefix: normalizePrefix(prefix),
        credentials
    };
}
