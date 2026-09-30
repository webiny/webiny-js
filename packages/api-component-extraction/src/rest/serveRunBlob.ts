import type { IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { RunRepository } from "~/domain/abstractions.js";
import { BlobStore } from "~/domain/stage.js";
import { ComponentExtractionPermissions } from "~/features/permissions.js";
import type { Run } from "~/domain/types.js";

const json = (statusCode: number, body: unknown): IHttpResponse => ({
    statusCode,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify(body)
});

const notFound = json(404, { message: "Image not found." });

/*
 * Long enough for a browser to follow the redirect and finish the transfer on a slow connection,
 * short enough that a URL captured from a log or a shared screenshot is not a lasting grant. The
 * authorisation this performs is what decides access; the signature only carries it far enough
 * to reach storage.
 */
const SIGNED_URL_SECONDS = 300;

/**
 * Serve one of a run's derived images, gated.
 *
 * Security is layered, and every layer matters: the request must carry the feature read permission;
 * the run is resolved through the tenant-scoped repository (so one tenant can never reach another's
 * run); and the requested `ref` must be one the run actually recorded — an allowlist, not a
 * path-traversal denylist. A blob store shared across tenants makes the run lookup, not the key, the
 * authority. Everything is a 404 rather than a 403 so an unauthorised caller cannot probe which runs
 * or images exist.
 *
 * The response redirects to a short-lived pre-signed URL rather than carrying the bytes. A Lambda
 * response is capped at 6MB and is base64-encoded on the way out, so a full-page screenshot over
 * roughly 4.5MB could not be returned at all: the platform replaced it with a 500 that carried no
 * CORS headers, which reached the admin as a network failure it could not even read the status of.
 * Redirecting keeps every check above and moves only the transfer, so size stops being a limit.
 *
 * `allowlist` is the only thing that varies between callers, which is why this is shared: a second
 * route serving a second kind of derived image must not become a second opinion about who may read a
 * run's images.
 */
export const serveRunBlob = async (params: {
    container: Container;
    runId: string | undefined;
    ref: string | undefined;
    allowlist: (run: Run) => Promise<Set<string>>;
}): Promise<IHttpResponse> => {
    const { container, runId, ref, allowlist } = params;

    if (!ref) {
        return json(400, { message: "Missing image reference." });
    }
    if (!runId) {
        return notFound;
    }

    const permissions = container.resolve(ComponentExtractionPermissions);
    if (!(await permissions.canRead("componentExtraction"))) {
        return notFound;
    }

    const runResult = await container.resolve(RunRepository).get(runId);
    if (runResult.isFail()) {
        return notFound;
    }

    const allowed = await allowlist(runResult.value);
    if (!allowed.has(ref)) {
        return notFound;
    }

    const signed = await container.resolve(BlobStore).signedUrl(ref, SIGNED_URL_SECONDS);
    if (signed.isFail()) {
        return notFound;
    }

    return {
        statusCode: 302,
        headers: {
            location: signed.value.url,
            "content-type": signed.value.contentType,
            /*
             * The redirect is never cached, even though the object it points at is immutable.
             * A cached redirect outlives the signature it carries, and the second visit then
             * follows a URL S3 has started refusing. The object itself is still safe to cache
             * hard — that now happens on S3's response rather than on this one — and the admin
             * keeps its per-session object-URL cache, so a repeated view makes no new request
             * at all.
             */
            "cache-control": "no-store"
        },
        body: ""
    };
};
