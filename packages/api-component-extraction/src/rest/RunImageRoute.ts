import {
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { RUN_IMAGE_ROUTE, stageArtifactKey } from "~/constants.js";
import { RunRepository } from "~/domain/abstractions.js";
import { StageArtifactStore, BlobStore } from "~/domain/stage.js";
import { stageEntry } from "~/domain/ledger.js";
import { ComponentExtractionPermissions } from "~/features/permissions.js";
import type { CaptureArtifact, RenderArtifact, SegmentArtifact } from "~/domain/artifacts.js";
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
 * authorisation this route performs is what decides access; the signature only carries it far enough
 * to reach storage.
 */
const SIGNED_URL_SECONDS = 300;

/**
 * `GET /_webiny/component-extraction/run/:runId/image?ref=<blob key>` — serves a run's derived images
 * (screenshots, section crops, page thumbnails) for the W7 visibility screens.
 *
 * Security is layered: the request must carry the feature read permission; the run is resolved through
 * the tenant-scoped repository (so one tenant can never reach another's run); and the requested `ref`
 * must be one of the image refs the run actually recorded — an allowlist read from the run's Capture and
 * Segment artifacts, not a path-traversal denylist. A blob store shared across tenants makes the run
 * lookup, not the key, the authority. Everything is a 404 rather than a 403 so an unauthorised caller
 * cannot probe which runs or images exist.
 *
 * The response is a redirect to a short-lived pre-signed URL rather than the bytes themselves. A
 * Lambda response is capped at 6MB and is base64-encoded on the way out, so a full-page screenshot
 * over roughly 4.5MB could not be returned at all: the platform replaced it with a 500 that carried
 * no CORS headers, which reached the admin as a network failure it could not even read the status
 * of. Redirecting keeps every check above — permission, tenant-scoped run lookup, and the allowlist
 * — and moves only the transfer, so size stops being a limit.
 */
class RunImageRouteImpl implements HttpRouteHandler.Interface {
    constructor(private container: Container) {}

    async handle(request: HttpRouteHandler.Request): Promise<IHttpResponse> {
        const runId = request.pathParameters.runId;
        const ref = request.query.ref;
        if (!ref) {
            return json(400, { message: "Missing image reference." });
        }

        const permissions = this.container.resolve(ComponentExtractionPermissions);
        if (!(await permissions.canRead("componentExtraction"))) {
            return notFound;
        }

        const runResult = await this.container.resolve(RunRepository).get(runId);
        if (runResult.isFail()) {
            return notFound;
        }

        const allowed = await this.allowedImageRefs(runResult.value);
        if (!allowed.has(ref)) {
            return notFound;
        }

        const signed = await this.container.resolve(BlobStore).signedUrl(ref, SIGNED_URL_SECONDS);
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
    }

    /** The set of image blob keys the run recorded — from its Capture and Segment artifacts. */
    private async allowedImageRefs(run: Run): Promise<Set<string>> {
        const store = this.container.resolve(StageArtifactStore);
        const allowed = new Set<string>();

        const captureKey = stageEntry(run.stages, "capture")?.artifacts.pages;
        if (captureKey) {
            const capture = await store.getJson<CaptureArtifact>(captureKey);
            if (capture.isOk() && capture.value) {
                for (const page of capture.value.pages) {
                    allowed.add(page.screenshotRef);
                    allowed.add(page.narrowScreenshotRef);
                    allowed.add(page.thumbnailRef);
                }
            }
        }

        const segmentKey = stageEntry(run.stages, "segment")?.artifacts.sections;
        if (segmentKey) {
            const segment = await store.getJson<SegmentArtifact>(segmentKey);
            if (segment.isOk() && segment.value) {
                for (const page of segment.value.pages) {
                    for (const section of page.sections) {
                        allowed.add(section.cropRef);
                    }
                }
            }
        }

        // Rendered-component screenshots (W7.7): keyed to the current Generate stage version, so a
        // Generate re-run's stale renders drop out of the allowlist automatically.
        const generate = stageEntry(run.stages, "generate");
        if (generate?.artifacts.components) {
            const rendersKey = stageArtifactKey(
                run.id,
                "generate",
                generate.stageVersion,
                "renders"
            );
            const renders = await store.getJson<RenderArtifact>(rendersKey);
            if (renders.isOk() && renders.value) {
                for (const record of renders.value.renders) {
                    allowed.add(record.renderRef);
                }
            }
        }

        allowed.delete("");
        return allowed;
    }
}

export const RunImageRoute = HttpRouteHandler.createImplementation({
    implementation: RunImageRouteImpl,
    dependencies: [RequestContainer]
});

class RunImageRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "component-extraction-run-image";
    readonly method = "GET";
    readonly path = RUN_IMAGE_ROUTE;
    readonly handler = RunImageRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const RunImageRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: RunImageRouteDefinitionImpl,
    dependencies: []
});
