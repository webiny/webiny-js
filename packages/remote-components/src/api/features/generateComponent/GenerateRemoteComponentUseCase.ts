import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { GenerateRemoteComponentUseCase as UseCaseAbstraction } from "./abstractions.js";
import { buildComponentPrompt } from "./buildComponentPrompt.js";
import { parseGeneratedSource } from "./parseGeneratedSource.js";
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

class GenerateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private ai: Ai.Interface,
        private getFileContents: GetFileContentsByIdUseCase.Interface,
        /*
         * Optional because AI Power-Ups registers nothing at all when it is switched off, so the
         * resolver is simply absent rather than failing on use. Handled below with a message that
         * says why, instead of a DI error at resolution time.
         */
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

        /*
         * The model comes from the capability, not from settings directly. That is what puts this
         * feature on the model roles screen, lets a project point it at a different model, and
         * makes its connection and API key someone else's problem. Every resolver failure names
         * the setting to fix, so it is passed through as it is.
         */
        const resolution = await this.resolveCapability.execute(REMOTE_COMPONENT_CAPABILITY);
        if (resolution.isFail()) {
            return Result.fail(resolution.error);
        }

        const capability = resolution.value;

        try {
            const userContent = await this.buildUserContent(input);

            const aiResult = await this.ai.generateText({
                model: capability.model,
                connection: capability.connection,
                system: withAdditionalInstructions(capability, buildComponentPrompt()),
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
            return Result.ok(parsed);
        } catch (error) {
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
