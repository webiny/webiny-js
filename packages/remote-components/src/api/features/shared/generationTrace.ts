import type { GenerationTrace } from "~/api/features/generateComponent/abstractions.js";

/** The model as the provider names it, whether resolved as a string or a model object. */
export const modelNameOf = (model: unknown): string =>
    typeof model === "string"
        ? model
        : String((model as { modelId?: unknown } | undefined)?.modelId ?? model);

/** A call's token usage, as AI SDK v7 reports it; absent when the provider reported none. */
export const usageOf = (aiResult: unknown): GenerationTrace["usage"] | undefined => {
    const usage = (aiResult as { usage?: Record<string, unknown> }).usage;
    if (!usage) {
        return undefined;
    }
    const details = (usage.inputTokenDetails ?? {}) as Record<string, unknown>;
    return {
        inputTokens: Number(usage.inputTokens ?? 0),
        outputTokens: Number(usage.outputTokens ?? 0),
        cacheReadTokens: Number(details.cacheReadTokens ?? 0),
        cacheWriteTokens: Number(details.cacheWriteTokens ?? 0)
    };
};

/** Calls a trace callback, ignoring its failure: a log that cannot be written must not fail the call. */
export const emitTrace = async (
    onTrace: ((trace: GenerationTrace) => void | Promise<void>) | undefined,
    trace: GenerationTrace
): Promise<void> => {
    if (!onTrace) {
        return;
    }
    try {
        await onTrace(trace);
    } catch {
        // Deliberately ignored.
    }
};
