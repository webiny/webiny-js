import { Output } from "ai";
import type { Container } from "@webiny/di";
import { HttpRoute, HttpStreamBody, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    AI_ENRICHMENT_PROMPT,
    aiEnrichmentSchema,
    ApplyImageEnrichmentUseCase,
    PrepareImageEnrichmentUseCase
} from "./abstractions.js";
import type { IPreparedImageEnrichment } from "./abstractions.js";
import { EnrichmentFileNotFoundError, EnrichmentNotAnImageError } from "./errors.js";
import type { ImageEnrichmentError } from "./errors.js";
import { toSseFrame } from "./streamEvents.js";

const SSE_HEADERS = {
    "content-type": "text/event-stream",
    // `no-transform` matters as much as `no-cache`: it tells CloudFront (and any other proxy) not to
    // compress or otherwise buffer the body, which would defeat incremental delivery.
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    // Nginx-family proxies buffer responses by default; this opts out. Harmless elsewhere.
    "x-accel-buffering": "no"
};

const JSON_HEADERS = { "content-type": "application/json" };

function errorStatusCode(error: ImageEnrichmentError): number {
    if (error instanceof EnrichmentFileNotFoundError) {
        return 404;
    }
    if (error instanceof EnrichmentNotAnImageError) {
        return 400;
    }
    return 500;
}

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

    // Collaborators are resolved lazily in handle(), not injected: HttpRouter constructs EVERY
    // registered route on every request just to path-match, and the file-manager use cases pull in
    // repositories that aren't registered outside a file-manager request. See the TODO in HttpRouter.
    constructor(private container: Container) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const fileId = request.pathParameters.fileId;

        if (!fileId) {
            return {
                statusCode: 400,
                headers: JSON_HEADERS,
                body: { message: "Missing file ID." }
            };
        }

        const prepare = this.container.resolve(PrepareImageEnrichmentUseCase);
        const preparedResult = await prepare.execute(fileId);

        if (preparedResult.isFail()) {
            const error = preparedResult.error;
            return {
                statusCode: errorStatusCode(error),
                headers: JSON_HEADERS,
                body: { message: error.message, code: error.code }
            };
        }

        const ai = this.container.resolve(Ai);
        const apply = this.container.resolve(ApplyImageEnrichmentUseCase);

        return {
            statusCode: 200,
            headers: SSE_HEADERS,
            body: new HttpStreamBody(this.enrich(preparedResult.value, ai, apply))
        };
    }

    private async *enrich(
        prepared: IPreparedImageEnrichment,
        ai: Ai.Interface,
        apply: ApplyImageEnrichmentUseCase.Interface
    ): AsyncGenerator<string> {
        yield toSseFrame({ type: "start", fileId: prepared.fileId, model: prepared.model });

        let tags: string[] = [];
        let description = "";

        try {
            const stream = await ai.streamText({
                model: prepared.model,
                output: Output.object({ schema: aiEnrichmentSchema }),
                connection: prepared.connection,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "file",
                                data: prepared.imageBase64,
                                mediaType: prepared.imageMediaType
                            },
                            {
                                type: "text",
                                text: AI_ENRICHMENT_PROMPT
                            }
                        ]
                    }
                ]
            });

            for await (const partial of stream.partialOutputStream) {
                // Partial output is exactly that — mid-stream the array can hold holes/undefined
                // entries, so filter to the strings that have actually arrived.
                tags = (partial?.tags ?? []).filter(
                    (tag: unknown): tag is string => typeof tag === "string"
                );
                description = partial?.description ?? "";
                yield toSseFrame({ type: "partial", tags, description });
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

        const appliedResult = await apply.execute({
            fileId: prepared.fileId,
            existingTags: prepared.existingTags,
            tags,
            description
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
    dependencies: [RequestContainer]
});
