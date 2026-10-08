import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { REMOTE_COMPONENT_CAPABILITY } from "~/api/capability.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { RefineRemoteComponentUseCase as UseCaseAbstraction } from "./abstractions.js";
import { buildRefinePrompt, buildRefineUserMessage } from "./buildRefinePrompt.js";
import { parseGeneratedSource } from "~/api/features/generateComponent/parseGeneratedSource.js";
import { cachedSystemPrompt, MAX_OUTPUT_TOKENS } from "~/api/features/shared/promptCaching.js";
import type { GenerationTrace } from "~/api/features/generateComponent/abstractions.js";
import { emitTrace, modelNameOf, usageOf } from "~/api/features/shared/generationTrace.js";

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

class RefineRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
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
        const systemText = withAdditionalInstructions(resolved.value, buildRefinePrompt());
        const userMessage = buildRefineUserMessage({
            currentSource: input.currentSource,
            currentCss: input.currentCss,
            feedback: input.feedback
        });

        const started = Date.now();
        let imagesAttached: GenerationTrace["imagesAttached"] = [];
        const trace = (rest: Partial<GenerationTrace>) =>
            emitTrace(input.onTrace, {
                model: modelNameOf(model),
                system: systemText,
                user: userMessage,
                imageFileIds: input.additionalFileIds ?? [],
                imagesAttached,
                durationMs: Date.now() - started,
                ...rest
            });

        try {
            const userContent: ContentPart[] = [{ type: "text", text: userMessage }];

            if (input.additionalFileIds && input.additionalFileIds.length > 0) {
                const images = await this.resolveImageFiles(input.additionalFileIds);
                userContent.push(...images);
                imagesAttached = images.map(image => ({
                    mediaType: image.mediaType,
                    bytes: image.data.byteLength
                }));
            }

            const aiResult = await this.ai.generateText({
                model,
                connection,
                ...cachedSystemPrompt(systemText, `${REMOTE_COMPONENT_CAPABILITY}.refine`),
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                abortSignal: input.abortSignal,
                messages: [
                    {
                        role: "user" as const,
                        content: userContent
                    }
                ]
            });

            const text =
                aiResult.text ||
                (aiResult.steps.filter((step: any) => step.text.length > 0).pop()?.text ?? "");

            await trace({
                ...(usageOf(aiResult) ? { usage: usageOf(aiResult) } : {}),
                finishReason: String((aiResult as { finishReason?: unknown }).finishReason ?? ""),
                outputChars: text.length,
                ...(text ? {} : { error: "AI returned an empty response." })
            });

            if (!text) {
                return Result.fail(new Error("AI returned an empty response."));
            }

            const parsed = parseGeneratedSource(text);
            return Result.ok({ source: parsed.source, css: parsed.css });
        } catch (error) {
            await trace({ error: error instanceof Error ? error.message : String(error) });
            return Result.fail(error as Error);
        }
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

export const RefineRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: RefineRemoteComponentUseCaseImpl,
    dependencies: [Ai, GetFileContentsByIdUseCase, [ResolveAiCapabilityUseCase, { optional: true }]]
});
