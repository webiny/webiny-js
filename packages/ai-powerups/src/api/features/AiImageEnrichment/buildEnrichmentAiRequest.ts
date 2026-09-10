import { Output } from "ai";
import type { Ai } from "@webiny/api-core/features/ai/index.js";
import { AI_ENRICHMENT_PROMPT, aiEnrichmentSchema } from "./abstractions.js";
import type { IPreparedImageEnrichment } from "./abstractions.js";

/**
 * Builds the AI request both enrichment entry points send — the background task via `generateText`
 * and the streaming route via `streamText`. Identical model, structured output, connection, and
 * message payload; only the call differs.
 *
 * This is also where `Output.object(...)` lives rather than on `IPreparedImageEnrichment`: the AI
 * SDK's `Output` type can't be named in emitted declarations (TS4023), so it has to be built inside a
 * function body, not held on an exported interface.
 */
export function buildEnrichmentAiRequest(
    prepared: IPreparedImageEnrichment
): Ai.GenerateTextParams {
    return {
        model: prepared.model,
        output: Output.object({ schema: aiEnrichmentSchema }),
        connection: prepared.connection,
        messages: [
            {
                role: "user",
                content: [
                    {
                        // Sent as base64, not a URL: a URL forces the provider to fetch the file,
                        // which fails for private files and can't reach a non-public origin.
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
    };
}
