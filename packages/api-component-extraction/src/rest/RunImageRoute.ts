import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { IMMUTABLE_CACHE_CONTROL, RUN_IMAGE_ROUTE, stageArtifactKey } from "~/constants.js";
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
 * Derived-image keys carry the stage version, so an object never changes under a key — hence the
 * immutable cache header; the content type comes from the stored object.
 */
class RunImageRouteImpl implements HttpRoute.Interface {
    readonly method = "GET";
    readonly path = RUN_IMAGE_ROUTE;

    constructor(private container: Container) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
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

        const object = await this.container.resolve(BlobStore).getObject(ref);
        if (object.isFail()) {
            return notFound;
        }

        return {
            statusCode: 200,
            headers: {
                "content-type": object.value.contentType,
                "cache-control": IMMUTABLE_CACHE_CONTROL
            },
            body: Buffer.from(object.value.bytes)
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

export const RunImageRoute = HttpRoute.createImplementation({
    implementation: RunImageRouteImpl,
    dependencies: [RequestContainer]
});
