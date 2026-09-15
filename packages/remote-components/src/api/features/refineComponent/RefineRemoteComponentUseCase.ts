import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { RefineRemoteComponentUseCase as UseCaseAbstraction } from "./abstractions.js";
import { buildRefinePrompt, buildRefineUserMessage } from "./buildRefinePrompt.js";
import { parseGeneratedSource } from "~/api/features/generateComponent/parseGeneratedSource.js";

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
        private encryption: Encryption.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private getFileContents: GetFileContentsByIdUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<UseCaseAbstraction.Output, Error>> {
        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return Result.fail(new Error("Failed to load AI settings."));
        }

        const settings = settingsResult.value as any;
        const firstProvider = settings.providers?.presets?.[0];

        if (!firstProvider) {
            return Result.fail(
                new Error("No AI provider configured. Add a provider in AI Power Ups settings.")
            );
        }

        const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);
        const systemText = buildRefinePrompt();
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
                model: firstProvider.model,
                connection: {
                    sdkName: firstProvider.model.split("/")[0],
                    apiKey
                },
                system: systemText,
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
    dependencies: [Ai, Encryption, GetSettingsUseCase, GetFileContentsByIdUseCase]
});
