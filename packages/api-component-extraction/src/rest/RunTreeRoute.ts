import {
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { RUN_TREE_ROUTE } from "~/constants.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { stageEntry } from "~/domain/ledger.js";
import type { CaptureArtifact, SegmentArtifact } from "~/domain/artifacts.js";
import type { Run } from "~/domain/types.js";
import { serveRunBlob } from "./serveRunBlob.js";

/**
 * `GET /_webiny/component-extraction/run/:runId/tree?ref=<blob key>` — serves a captured page's
 * pruned node tree.
 *
 * The trees are the only place the pipeline keeps what a page actually measured: a box on every node
 * and eighteen computed properties, including `fontSize`, `lineHeight`, `paddingTop` and `paddingLeft`.
 * Nothing could read them. That has now blocked three separate measurements — images seen but never
 * bound, how tight a cluster's members really are, and whether a generated component's proportions
 * match the section it was built from — and each time the answer was bounded or worked around rather
 * than measured.
 *
 * This adds no new authority. `serveRunBlob` already performs the permission check, the tenant-scoped
 * run lookup, the allowlist check and the pre-signed redirect, and was written to be shared precisely
 * so that a second route serving a second kind of blob does not become a second opinion about who may
 * read a run's artifacts. All this supplies is which refs are trees.
 */
class RunTreeRouteImpl implements HttpRouteHandler.Interface {
    constructor(private container: Container) {}

    async handle(request: HttpRouteHandler.Request): Promise<IHttpResponse> {
        return serveRunBlob({
            container: this.container,
            runId: request.pathParameters.runId,
            ref: request.query.ref,
            allowlist: run => this.allowedTreeRefs(run)
        });
    }

    /**
     * The tree blob keys this run recorded.
     *
     * Taken from both Capture and Segment: Segment forwards the ref so Cluster can read subtrees
     * without reaching back, and reading both means a run whose Segment artifact is stale or missing
     * still serves the trees Capture produced.
     */
    private async allowedTreeRefs(run: Run): Promise<Set<string>> {
        const store = this.container.resolve(StageArtifactStore);
        const allowed = new Set<string>();

        const captureKey = stageEntry(run.stages, "capture")?.artifacts.pages;
        if (captureKey) {
            const capture = await store.getJson<CaptureArtifact>(captureKey);
            if (capture.isOk() && capture.value) {
                for (const page of capture.value.pages) {
                    allowed.add(page.treeRef);
                }
            }
        }

        const segmentKey = stageEntry(run.stages, "segment")?.artifacts.sections;
        if (segmentKey) {
            const segment = await store.getJson<SegmentArtifact>(segmentKey);
            if (segment.isOk() && segment.value) {
                for (const page of segment.value.pages) {
                    allowed.add(page.treeRef);
                }
            }
        }

        allowed.delete("");
        return allowed;
    }
}

export const RunTreeRoute = HttpRouteHandler.createImplementation({
    implementation: RunTreeRouteImpl,
    dependencies: [RequestContainer]
});

class RunTreeRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "component-extraction-run-tree";
    readonly method = "GET";
    readonly path = RUN_TREE_ROUTE;
    readonly handler = RunTreeRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const RunTreeRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: RunTreeRouteDefinitionImpl,
    dependencies: []
});
