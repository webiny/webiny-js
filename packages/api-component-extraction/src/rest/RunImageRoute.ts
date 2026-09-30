import {
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { RUN_IMAGE_ROUTE, stageArtifactKey } from "~/constants.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { stageEntry } from "~/domain/ledger.js";
import type { CaptureArtifact, RenderArtifact, SegmentArtifact } from "~/domain/artifacts.js";
import type { Run } from "~/domain/types.js";
import { serveRunBlob } from "./serveRunBlob.js";

/**
 * `GET /_webiny/component-extraction/run/:runId/image?ref=<blob key>` — serves a run's derived images
 * (screenshots, section crops, page thumbnails) for the W7 visibility screens.
 *
 * The gating, the tenant scoping and the pre-signed redirect live in `serveRunBlob`, shared with the
 * composed-screenshot route. All this adds is the allowlist: which refs THIS run actually recorded.
 */
class RunImageRouteImpl implements HttpRouteHandler.Interface {
    constructor(private container: Container) {}

    async handle(request: HttpRouteHandler.Request): Promise<IHttpResponse> {
        return serveRunBlob({
            container: this.container,
            runId: request.pathParameters.runId,
            ref: request.query.ref,
            allowlist: run => this.allowedImageRefs(run)
        });
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
