import { createHash } from "node:crypto";
import type { CapturedImage, SkippedImage } from "~/abstractions.js";

/**
 * Collects the bytes of every image a page loads, from the responses the browser already received.
 *
 * Reading the network rather than re-requesting is a correctness requirement, not a saving. A CDN can
 * return a different representation of one URL depending on the request — Cloudinary's `f_auto`
 * serves WebP to Chrome and PNG to a plain server-side fetch, measurably different bytes at the same
 * address — so anything that fetches later stores an image the visitor never saw, silently.
 *
 * Two bounds, both of which report rather than drop:
 *
 * - **A per-page byte ceiling.** Bytes go from the network into memory and out to the caller, never
 *   through `/tmp`, so memory is what binds. Measured on the demo corpus a whole site is about 2 MB,
 *   so this will not bite there — but a site with real photography behaves differently, and the
 *   ceiling is what turns that into a recorded unmigrated image instead of a capture failure.
 * - **A concurrency limit**, so a page with fifty images holds a few buffers rather than fifty.
 */
export interface ImageCollector {
    /** Offer one response to the collector. Returns once that response has been dealt with. */
    offer(response: ImageResponse, context?: { embedded?: boolean }): Promise<void>;
    /** Wait for every offered response to finish, then hand back what was collected. */
    drain(): Promise<{ images: CapturedImage[]; skipped: SkippedImage[] }>;
}

/** The slice of a Puppeteer response this needs, so the collector is testable without a browser. */
export interface ImageResponse {
    url(): string;
    headers(): Record<string, string>;
    buffer(): Promise<Buffer | Uint8Array>;
    /** Optional so a test double need not fake it; Puppeteer's response always has it. */
    status?(): number;
}

const DEFAULT_CONCURRENCY = 4;

export const createImageCollector = (options: {
    maxTotalBytes: number;
    maxConcurrent?: number;
}): ImageCollector => {
    const images: CapturedImage[] = [];
    const skipped: SkippedImage[] = [];
    const seen = new Set<string>();
    const pending = new Set<Promise<void>>();

    let collectedBytes = 0;

    const limit = Math.max(1, options.maxConcurrent ?? DEFAULT_CONCURRENCY);

    /*
     * A slot semaphore, not a "wait while the count is high" loop.
     *
     * The loop form is check-then-act: several offers can all observe a free slot before any of them
     * takes one, and the limit silently stops holding. Measured, eight concurrent offers against a
     * limit of two ran all eight at once.
     *
     * Here a slot is created only when one is free, and on release it is HANDED to the next waiter
     * rather than freed and re-contended, so the count cannot drift above the limit.
     */
    let active = 0;
    const waiting: Array<() => void> = [];

    const acquire = async (): Promise<void> => {
        if (active < limit) {
            active++;
            return;
        }
        await new Promise<void>(resolve => waiting.push(resolve));
    };

    const release = (): void => {
        const next = waiting.shift();
        if (next) {
            next();
            return;
        }
        active--;
    };

    const read = async (
        response: ImageResponse,
        url: string,
        contentType: string,
        embedded: boolean
    ): Promise<void> => {
        try {
            const raw = await response.buffer();
            const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);

            /*
             * The ceiling is checked against the size actually read, not against `content-length`.
             * On a compressed response the two disagree — a brotli body reads 10,751 bytes against a
             * 4,279-byte wire length — and it is the decoded size that occupies memory.
             */
            if (collectedBytes + bytes.byteLength > options.maxTotalBytes) {
                skipped.push({
                    url,
                    reason: "page-byte-ceiling",
                    detail: `${bytes.byteLength} bytes would pass the ${options.maxTotalBytes}-byte page ceiling`
                });
                return;
            }

            collectedBytes += bytes.byteLength;
            images.push({
                url,
                contentType,
                sha256: createHash("sha256").update(bytes).digest("hex"),
                bytes,
                size: bytes.byteLength,
                embedded
            });
        } catch (error) {
            // A body can be gone by the time it is asked for — a redirect, a cancelled request, a
            // navigation. Recorded, because an image nobody can account for is the thing to avoid.
            skipped.push({
                url,
                reason: "unreadable",
                detail: (error as Error).message?.slice(0, 200)
            });
        }
    };

    return {
        async offer(response, context) {
            const url = response.url();
            // A data: URI is already the bytes and needs no migration; one URL is fetched once.
            if (!url || url.startsWith("data:") || seen.has(url)) {
                return;
            }
            seen.add(url);

            const contentType = (response.headers()["content-type"] ?? "").split(";")[0].trim();
            if (!contentType.startsWith("image/")) {
                skipped.push({
                    url,
                    reason: "not-an-image",
                    detail: contentType || "(no content-type)",
                    status: response.status?.()
                });
                return;
            }

            await acquire();

            const task = read(response, url, contentType, context?.embedded ?? false).finally(
                () => {
                    release();
                    pending.delete(task);
                }
            );
            pending.add(task);
        },

        async drain() {
            while (pending.size > 0) {
                await Promise.allSettled([...pending]);
            }
            return { images, skipped };
        }
    };
};
