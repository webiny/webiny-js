import { createHash } from "node:crypto";
import { BundleFetchError, BundleHashMismatchError, BundleSizeLimitError } from "./errors.js";

export function computeSha256(bytes: Buffer): string {
    return createHash("sha256").update(bytes).digest("hex");
}

export function verifyHash(bytes: Buffer, expectedSha256: string): void {
    const actual = computeSha256(bytes);
    if (actual !== expectedSha256) {
        throw new BundleHashMismatchError("(in-memory)", expectedSha256, actual);
    }
}

export interface FetchAndVerifyOptions {
    url: string;
    expectedSha256: string;
    timeoutMs: number;
    maxBytes: number;
}

export async function fetchAndVerify(options: FetchAndVerifyOptions): Promise<Buffer> {
    const { url, expectedSha256, timeoutMs, maxBytes } = options;

    let response: Response;
    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(timeoutMs)
        });
    } catch (error) {
        throw new BundleFetchError(url, undefined, error as Error);
    }

    if (!response.ok) {
        throw new BundleFetchError(url, response.status);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength !== null) {
        const declaredSize = parseInt(contentLength, 10);
        if (declaredSize > maxBytes) {
            throw new BundleSizeLimitError(url, declaredSize, maxBytes);
        }
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length > maxBytes) {
        throw new BundleSizeLimitError(url, bytes.length, maxBytes);
    }

    const actual = computeSha256(bytes);
    if (actual !== expectedSha256) {
        throw new BundleHashMismatchError(url, expectedSha256, actual);
    }

    return bytes;
}
