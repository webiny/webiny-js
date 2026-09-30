import {
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
import { serveRunBlob } from "@webiny/api-component-extraction/rest/serveRunBlob.js";
import type { Run } from "@webiny/api-component-extraction/domain/types.js";
import { ComposedCaptureStore } from "~/domain/abstractions.js";
import { COMPOSED_IMAGE_ROUTE } from "~/constants.js";

/**
 * `GET /_webiny/page-composition-poc/run/:runId/image?ref=<blob key>` — serves a composed page's
 * screenshot, the half of the comparison a local harness produced.
 *
 * A second route rather than a second allowlist inside the extraction one: this package consumes
 * component extraction, and having the extraction route reach into this package's key-value store
 * would invert that and leave a field behind when the PoC goes. The gating, the tenant-scoped run
 * lookup and the pre-signed redirect are shared with it — see `serveRunBlob` — so there is still
 * exactly one answer to who may read a run's images.
 */
class ComposedImageRouteImpl implements HttpRouteHandler.Interface {
    constructor(private container: Container) {}

    async handle(request: HttpRouteHandler.Request): Promise<IHttpResponse> {
        return serveRunBlob({
            container: this.container,
            runId: request.pathParameters.runId,
            ref: request.query.ref,
            allowlist: run => this.allowedImageRefs(run)
        });
    }

    /**
     * The refs the run's composed capture recorded — and only the current one.
     *
     * The record holds one capture at a time, so a recompose followed by a fresh capture drops the
     * previous version's refs out of the allowlist by construction. An older image stops being
     * servable at the moment it stops being the answer, which is the behaviour the versioned keys
     * exist to make possible.
     */
    private async allowedImageRefs(run: Run): Promise<Set<string>> {
        const allowed = new Set<string>();
        const capture = await this.container.resolve(ComposedCaptureStore).get(run.id);
        if (capture.isOk() && capture.value) {
            for (const page of capture.value.pages) {
                if (page.screenshotRef) {
                    allowed.add(page.screenshotRef);
                }
            }
        }
        allowed.delete("");
        return allowed;
    }
}

export const ComposedImageRoute = HttpRouteHandler.createImplementation({
    implementation: ComposedImageRouteImpl,
    dependencies: [RequestContainer]
});

class ComposedImageRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "page-composition-poc-composed-image";
    readonly method = "GET";
    readonly path = COMPOSED_IMAGE_ROUTE;
    readonly handler = ComposedImageRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const ComposedImageRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: ComposedImageRouteDefinitionImpl,
    dependencies: []
});
