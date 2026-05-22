import { stepCountIs } from "ai";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { AiPromptContextBuilder } from "~/api/features/AiPromptContext/index.js";
import { createReadProjectFileTool } from "~/api/features/AiPromptContext/ReadProjectFileTool.js";
import { WbGeneratePageContentUseCase } from "./abstractions.js";
import type {
    WbGeneratePageContentParams,
    GeneratePageContentResult,
    GenerationTelemetry
} from "./abstractions.js";
import { buildDomainPrompt } from "./buildPrompt.js";

function stripCodeFence(text: string): string {
    return text
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();
}

class WbGeneratePageContentUseCaseImpl implements WbGeneratePageContentUseCase.Interface {
    constructor(
        private promptContextBuilder: AiPromptContextBuilder.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private ai: Ai.Interface,
        private aiSdkTools: AiSdkTools.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(
        params: WbGeneratePageContentParams
    ): Promise<Result<GeneratePageContentResult, Error>> {
        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return Result.fail(new Error("Failed to load AI PowerUps settings."));
        }

        const settings = settingsResult.value;
        const firstProvider = settings.providers.presets[0];

        if (!firstProvider) {
            return Result.fail(
                new Error("No AI provider configured. Add a provider in AI Power Ups settings.")
            );
        }

        const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);

        const sdkTools = this.aiSdkTools.getToolSet();

        const context = await this.promptContextBuilder.execute({
            projectId: params.projectId,
            readerPersonaId: params.readerPersonaId,
            writerPersonaId: params.writerPersonaId,
            excludedFileIds: params.excludedFileIds
        });

        if (context.allProjectFiles.length > 0) {
            const projectFileTool = createReadProjectFileTool(
                context.allProjectFiles,
                context.excludedFileIds
            );
            Object.assign(sdkTools, projectFileTool);
        }

        const systemText = buildDomainPrompt(params.components, params.tools) + context.toString();

        const system = {
            role: "system" as const,
            content: systemText,
            providerOptions: {
                anthropic: {
                    cacheControl: { type: "ephemeral" }
                }
            }
        };

        try {
            const aiResult = await this.ai.generateText({
                model: firstProvider.model,
                connection: {
                    sdkName: firstProvider.model.split("/")[0],
                    apiKey
                },
                system,
                toolChoice: "auto",
                prompt: params.prompt,
                ...(Object.keys(sdkTools).length > 0
                    ? { tools: sdkTools, stopWhen: stepCountIs(20) }
                    : {})
            });

            const text =
                aiResult.text ||
                (aiResult.steps.filter(step => step.text.length > 0).pop()?.text ?? "");

            const output = stripCodeFence(text);

            const filesRead = new Set<string>();
            let toolCallsMade = 0;
            for (const step of aiResult.steps) {
                for (const call of step.toolCalls) {
                    toolCallsMade++;
                    if (call.toolName === "read_project_file") {
                        const input = call.input as { fileId?: string };
                        if (input.fileId) {
                            filesRead.add(input.fileId);
                        }
                    }
                }
            }

            const telemetry: GenerationTelemetry = {
                filesRead: [...filesRead],
                cacheHit: context.cacheHit,
                toolCallsMade,
                totalSteps: aiResult.steps.length
            };

            return Result.ok({ output, telemetry });
        } catch (error) {
            return Result.fail(
                new Error(
                    `AI generation failed: ${error instanceof Error ? error.message : String(error)}`
                )
            );
        }
    }
}

export const WbGeneratePageContentUseCaseImplementation =
    WbGeneratePageContentUseCase.createImplementation({
        implementation: WbGeneratePageContentUseCaseImpl,
        dependencies: [AiPromptContextBuilder, GetSettingsUseCase, Ai, AiSdkTools, Encryption]
    });
