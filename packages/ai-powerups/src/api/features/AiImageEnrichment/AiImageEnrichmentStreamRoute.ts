import { HttpRoute, toSseFrame } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { ApplyImageEnrichmentUseCase, PrepareImageEnrichmentUseCase } from "./abstractions.js";
import type { IPreparedImageEnrichment } from "./abstractions.js";
import { buildEnrichmentAiRequest } from "./buildEnrichmentAiRequest.js";
import { readEnrichmentPartial } from "./readEnrichmentPartial.js";
import { imageEnrichmentErrorStatusCode } from "./imageEnrichmentErrorStatusCode.js";

/**
 * Re-runs AI enrichment for a single file, streaming progress to the caller as server-sent events.
 *
 * Preparation (file lookup, image read, provider resolution) happens BEFORE the response opens, so
 * anything knowable up front — missing file, wrong type, no provider — comes back as a real status
 * code. Only the AI call itself streams; once the first byte is out the status is committed to 200
 * and failures can only be reported as an `error` event.
 */
class AiImageEnrichmentStreamRouteImpl implements HttpRoute.Interface {
    readonly method = "POST";
    readonly path = "/stream/fm/files/:fileId/enrich";

    constructor(
        private prepare: PrepareImageEnrichmentUseCase.Interface,
        private apply: ApplyImageEnrichmentUseCase.Interface,
        private ai: Ai.Interface
    ) {}

    async handle(
        request: IHttpRequest,
        response: IHttpResponseBuilder
    ): Promise<IHttpResponseBuilder> {
        const fileId = request.pathParameters.fileId;

        if (!fileId) {
            return response.status(400).json({ message: "Missing file ID." });
        }

        const preparedResult = await this.prepare.execute(fileId);

        if (preparedResult.isFail()) {
            const error = preparedResult.error;

            const statusCode = imageEnrichmentErrorStatusCode(error);

            return response.status(statusCode).json({ message: error.message, code: error.code });
        }

        const events = this.enrich(preparedResult.value);

        return response.sse(events);
    }

    private async *enrich(prepared: IPreparedImageEnrichment): AsyncGenerator<string> {
        yield toSseFrame({ type: "start", fileId: prepared.fileId, model: prepared.model });

        let output = { tags: [] as string[], description: "" };

        try {
            const request = buildEnrichmentAiRequest(prepared);
            const stream = await this.ai.streamText(request);

            for await (const partial of stream.partialOutputStream) {
                output = readEnrichmentPartial(partial);
                yield toSseFrame({ type: "partial", ...output });
            }
        } catch (error) {
            yield toSseFrame({
                type: "error",
                message: `AI enrichment failed: ${
                    error instanceof Error ? error.message : String(error)
                }`
            });
            return;
        }

        const appliedResult = await this.apply.execute({
            fileId: prepared.fileId,
            existingTags: prepared.existingTags,
            ...output
        });

        if (appliedResult.isFail()) {
            yield toSseFrame({ type: "error", message: appliedResult.error.message });
            return;
        }

        const applied = appliedResult.value;
        yield toSseFrame({
            type: "done",
            fileId: applied.fileId,
            tags: applied.tags,
            description: applied.description
        });
    }
}

export const AiImageEnrichmentStreamRoute = HttpRoute.createImplementation({
    implementation: AiImageEnrichmentStreamRouteImpl,
    dependencies: [PrepareImageEnrichmentUseCase, ApplyImageEnrichmentUseCase, Ai]
});
