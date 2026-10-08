import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { REMOTE_COMPONENT_CAPABILITY } from "~/api/capability.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import {
    GenerateRemoteComponentUseCase as UseCaseAbstraction,
    type GenerationTrace
} from "./abstractions.js";
import { buildComponentPrompt } from "./buildComponentPrompt.js";
import { parseGeneratedSource } from "./parseGeneratedSource.js";
import { cachedSystemPrompt, MAX_OUTPUT_TOKENS } from "~/api/features/shared/promptCaching.js";

interface FilePart {
    type: "file";
    data: Uint8Array;
    mediaType: string;
}

interface TextPart {
    type: "text";
    text: string;
}

type ContentPart = TextPart | FilePart;

/** What a streamed answer has produced so far, and when its chunks arrived. */
export const streamProgress = (started: number, now: () => number = Date.now) => {
    const parts: string[] = [];
    let reasoningChars = 0;
    let chunks = 0;
    let firstChunkMs: number | null = null;
    let lastChunkMs: number | null = null;
    const text = () => parts.join("");
    const timing = (): NonNullable<GenerationTrace["stream"]> => ({
        firstChunkMs,
        lastChunkMs,
        chunks,
        reasoningChars
    });
    return {
        chunk(type: "text-delta" | "reasoning-delta", value: string) {
            const at = now() - started;
            firstChunkMs ??= at;
            lastChunkMs = at;
            chunks++;
            if (type === "text-delta") {
                parts.push(value);
            } else {
                reasoningChars += value.length;
            }
        },
        text,
        timing,
        partial(): Partial<GenerationTrace> {
            const written = text();
            return { outputChars: written.length, partialOutput: written, stream: timing() };
        }
    };
};

class GenerateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private ai: Ai.Interface,
        private getFileContents: GetFileContentsByIdUseCase.Interface,
        // AI Power-Ups registers nothing when the feature is off, so the resolver can be absent.
        private resolveCapability?: ResolveAiCapabilityUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<UseCaseAbstraction.Output, Error>> {
        if (!this.resolveCapability) {
            return Result.fail(new Error("AI Power-Ups is not enabled on this project."));
        }

        const resolved = await this.resolveCapability.execute(REMOTE_COMPONENT_CAPABILITY);
        if (resolved.isFail()) {
            // The resolver's message names the settings screen and what to pick there.
            return Result.fail(resolved.error);
        }
        const { model, connection } = resolved.value;
        // With any instructions the project added to the capability in settings.
        const systemText = withAdditionalInstructions(
            resolved.value,
            buildComponentPrompt({
                ablate: input.ablate,
                tokenCatalog: input.tokenCatalog,
                rewriteExampleVariable: input.rewriteExampleVariable
            })
        );

        const started = Date.now();
        const modelName =
            typeof model === "string"
                ? model
                : String((model as { modelId?: unknown } | undefined)?.modelId ?? model);
        let userText = "";
        let imagesAttached: GenerationTrace["imagesAttached"] = [];
        const progress = streamProgress(started);
        const trace = async (rest: Partial<GenerationTrace>) => {
            if (!input.onTrace) {
                return;
            }
            try {
                await input.onTrace({
                    model: modelName,
                    system: systemText,
                    user: userText,
                    imageFileIds: input.additionalFileIds ?? [],
                    imagesAttached,
                    durationMs: Date.now() - started,
                    ...rest
                });
            } catch {
                // A log that cannot be written must not fail the generation it describes.
            }
        };

        try {
            const userContent = await this.buildUserContent(input);
            userText = userContent
                .filter((part): part is TextPart => part.type === "text")
                .map(part => part.text)
                .join("\n");
            imagesAttached = userContent
                .filter((part): part is FilePart => part.type === "file")
                .map(part => ({ mediaType: part.mediaType, bytes: part.data.byteLength }));

            // Streamed so that a call cut off at its limit still leaves what it had written, and when.
            const streamed = await this.ai.streamText({
                model,
                connection,
                ...cachedSystemPrompt(systemText, `${REMOTE_COMPONENT_CAPABILITY}.generate`),
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                abortSignal: input.abortSignal,
                messages: [
                    {
                        role: "user" as const,
                        content: userContent
                    }
                ]
            });

            let finish: { reason: string; usage: Record<string, unknown> } | null = null;
            let failure: unknown = null;
            try {
                for await (const part of streamed.fullStream) {
                    if (part.type === "text-delta" || part.type === "reasoning-delta") {
                        progress.chunk(part.type, part.text);
                    } else if (part.type === "finish") {
                        finish = {
                            reason: String(part.finishReason ?? ""),
                            usage: (part.totalUsage ?? {}) as Record<string, unknown>
                        };
                    } else if (part.type === "error") {
                        failure = part.error;
                    } else if (part.type === "abort") {
                        failure = input.abortSignal?.reason ?? new Error(part.reason || "aborted");
                    }
                }
            } catch (error) {
                failure = error;
            }
            if (!failure && !finish && input.abortSignal?.aborted) {
                failure = input.abortSignal.reason;
            }
            if (failure || !finish) {
                const error =
                    failure instanceof Error
                        ? failure
                        : new Error(failure ? String(failure) : "The stream ended without finishing.");
                await trace({ error: error.message, ...progress.partial() });
                return Result.fail(error);
            }

            const text = progress.text();
            const usage = finish.usage;
            const details = (usage.inputTokenDetails ?? {}) as Record<string, unknown>;
            await trace({
                usage: {
                    inputTokens: Number(usage.inputTokens ?? 0),
                    outputTokens: Number(usage.outputTokens ?? 0),
                    cacheReadTokens: Number(details.cacheReadTokens ?? 0),
                    cacheWriteTokens: Number(details.cacheWriteTokens ?? 0)
                },
                finishReason: finish.reason,
                outputChars: text.length,
                stream: progress.timing(),
                ...(text ? {} : { error: "AI returned an empty response." })
            });

            if (!text) {
                return Result.fail(new Error("AI returned an empty response."));
            }

            const parsed = parseGeneratedSource(text);
            return Result.ok(parsed);
        } catch (error) {
            await trace({
                error: error instanceof Error ? error.message : String(error),
                ...progress.partial()
            });
            return Result.fail(error as Error);
        }
    }

    private async buildUserContent(input: UseCaseAbstraction.Input): Promise<ContentPart[]> {
        const lines: string[] = [];

        if (input.name) {
            lines.push(`Component name: ${input.name}`);
        }
        if (input.label) {
            lines.push(`Component label: ${input.label}`);
        }
        if (input.description) {
            lines.push(`Component description: ${input.description}`);
        }

        lines.push("");
        lines.push(input.prompt);

        const parts: ContentPart[] = [{ type: "text", text: lines.join("\n") }];

        if (input.additionalFileIds && input.additionalFileIds.length > 0) {
            const images = await this.resolveImageFiles(input.additionalFileIds);
            parts.push(...images);
        }

        return parts;
    }

    private async resolveImageFiles(fileIds: string[]): Promise<FilePart[]> {
        const files: FilePart[] = [];

        for (const fileId of fileIds) {
            const result = await this.getFileContents.execute(fileId);
            if (result.isFail()) {
                continue;
            }

            const { buffer, contentType } = result.value;
            if (!contentType.startsWith("image/")) {
                continue;
            }

            files.push({
                type: "file",
                data: new Uint8Array(buffer),
                mediaType: contentType
            });
        }

        return files;
    }
}

export const GenerateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: GenerateRemoteComponentUseCaseImpl,
    dependencies: [Ai, GetFileContentsByIdUseCase, [ResolveAiCapabilityUseCase, { optional: true }]]
});
