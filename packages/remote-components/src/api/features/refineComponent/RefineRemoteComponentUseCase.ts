import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { RefineRemoteComponentUseCase as UseCaseAbstraction } from "./abstractions.js";
import { buildRefinePrompt, buildRefineUserMessage } from "./buildRefinePrompt.js";
import { parseGeneratedSource } from "~/api/features/generateComponent/parseGeneratedSource.js";
import { REMOTE_COMPONENT_CAPABILITY } from "~/api/capability.js";

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
        /* Optional for the same reason as in generate: absent when AI Power-Ups is off. */
        private resolveCapability?: ResolveAiCapabilityUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<UseCaseAbstraction.Output, Error>> {
        if (!this.resolveCapability) {
            return Result.fail(
                new Error("Component generation needs AI Power-Ups, which is not enabled.")
            );
        }

        /* Same capability as generate: refining is the same job, so it uses the same model. */
        const resolution = await this.resolveCapability.execute(REMOTE_COMPONENT_CAPABILITY);
        if (resolution.isFail()) {
            return Result.fail(resolution.error);
        }

        const capability = resolution.value;
        const userMessage = buildRefineUserMessage({
            currentSource: input.currentSource,
            currentCss: input.currentCss,
            feedback: input.feedback
        });

        try {
            const userContent: ContentPart[] = [{ type: "text", text: userMessage }];

            if (input.additionalFileIds && input.additionalFileIds.length > 0) {
                const images = await this.resolveImageFiles(input.additionalFileIds);
                userContent.push(...images);
            }

            const aiResult = await this.ai.generateText({
                model: capability.model,
                connection: capability.connection,
                system: withAdditionalInstructions(capability, buildRefinePrompt()),
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

            if (!text) {
                return Result.fail(new Error("AI returned an empty response."));
            }

            const parsed = parseGeneratedSource(text);
            return Result.ok({ source: parsed.source, css: parsed.css });
        } catch (error) {
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
