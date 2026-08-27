import { createAbstraction, Result } from "@webiny/feature/api";
import { z } from "zod";
import type { ImageEnrichmentError } from "./errors.js";

export const AI_ENRICHMENT_PROMPT =
    "Analyze this image and return up to 5 lowercase descriptive tags and one short sentence describing the image.";

/**
 * The shape both entry points ask the model for. Exported as the bare zod schema rather than a
 * ready-made `Output.object(...)`: the AI SDK's `Output` type can't be named in emitted declarations
 * (TS4023), so each call site wraps this locally instead.
 */
export const aiEnrichmentSchema = z.object({
    tags: z.array(z.string()),
    description: z.string()
});

/** The enrichment result: what the model produces and what gets persisted. */
export interface IEnrichmentOutput {
    tags: string[];
    description: string;
}

/**
 * Everything needed to run the AI call, gathered up front: the image bytes, the resolved provider,
 * and the file's current tags (needed to merge rather than overwrite).
 *
 * Deliberately split from the AI call itself so both entry points share the same preparation and the
 * same failure modes — and so the streaming route can answer with a real HTTP status code for
 * anything knowable before the stream opens, instead of burying it in a 200 response.
 */
export interface IPreparedImageEnrichment {
    fileId: string;
    existingTags: string[];
    imageBase64: string;
    imageMediaType: string;
    model: string;
    connection: {
        sdkName: string;
        apiKey: string;
    };
}

export interface IPrepareImageEnrichmentUseCase {
    execute(fileId: string): Promise<Result<IPreparedImageEnrichment, ImageEnrichmentError>>;
}

export const PrepareImageEnrichmentUseCase = createAbstraction<IPrepareImageEnrichmentUseCase>(
    "PrepareImageEnrichmentUseCase"
);

export namespace PrepareImageEnrichmentUseCase {
    export type Interface = IPrepareImageEnrichmentUseCase;
}

export interface IApplyImageEnrichmentParams {
    fileId: string;
    /** The file's tags before enrichment; AI tags are merged into these, never replacing them. */
    existingTags: string[];
    tags: string[];
    description: string;
}

export interface IAppliedImageEnrichment {
    fileId: string;
    tags: string[];
    description: string;
}

export interface IApplyImageEnrichmentUseCase {
    execute(
        params: IApplyImageEnrichmentParams
    ): Promise<Result<IAppliedImageEnrichment, ImageEnrichmentError>>;
}

export const ApplyImageEnrichmentUseCase = createAbstraction<IApplyImageEnrichmentUseCase>(
    "ApplyImageEnrichmentUseCase"
);

export namespace ApplyImageEnrichmentUseCase {
    export type Interface = IApplyImageEnrichmentUseCase;
}
