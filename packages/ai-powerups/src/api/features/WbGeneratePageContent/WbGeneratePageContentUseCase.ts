import { stepCountIs } from "ai";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { ListTagsUseCase } from "@webiny/api-file-manager/features/file/ListTags/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "~/api/features/Capabilities/index.js";
import { WB_GENERATE_PAGE_CAPABILITY } from "./capability.js";
import {
    AiPromptContextBuilder,
    formatAdditionalFilesContext
} from "~/api/features/AiPromptContext/index.js";
import { createReadProjectFileTool } from "~/api/features/AiPromptContext/ReadProjectFileTool.js";
import { WbGeneratePageContentUseCase } from "./abstractions.js";
import type {
    WbGeneratePageContentParams,
    GeneratePageContentResult,
    GenerationTelemetry
} from "./abstractions.js";
import { buildDomainPrompt } from "./buildPrompt.js";
import { LlmJsonResponse } from "~/domain/LlmJsonResponse.js";
import { ComponentFilter } from "./ComponentFilter.js";

class WbGeneratePageContentUseCaseImpl implements WbGeneratePageContentUseCase.Interface {
    constructor(
        private promptContextBuilder: AiPromptContextBuilder.Interface,
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private ai: Ai.Interface,
        private aiSdkTools: AiSdkTools.Interface,
        private listTags: ListTagsUseCase.Interface
    ) {}

    async execute(
        params: WbGeneratePageContentParams
    ): Promise<Result<GeneratePageContentResult, Error>> {
        const resolved = await this.resolveCapability.execute(WB_GENERATE_PAGE_CAPABILITY);
        if (resolved.isFail()) {
            return Result.fail(resolved.error);
        }

        const capability = resolved.value;

        const sdkTools = this.aiSdkTools.getToolSet();

        const context = await this.promptContextBuilder.execute({
            projectId: params.projectId,
            readerPersonaId: params.readerPersonaId,
            writerPersonaId: params.writerPersonaId,
            excludedFileIds: params.excludedFileIds,
            additionalFileIds: params.additionalFileIds
        });

        if (context.allProjectFiles.length > 0) {
            const projectFileTool = createReadProjectFileTool(
                context.allProjectFiles,
                context.excludedFileIds
            );
            Object.assign(sdkTools, projectFileTool);
        }

        // Fetch image tags so the prompt can enumerate what's queryable; without
        // this the model invents tag/IDs instead of calling listImagesByTag.
        const tagsResult = await this.listTags.execute({
            where: { type_startsWith: "image/" },
            limit: 100
        });
        const imageTags = tagsResult.isOk() ? tagsResult.value.map(t => t.tag) : [];

        const components = params.components as Array<{ name: string }>;
        const systemText = withAdditionalInstructions(
            capability,
            buildDomainPrompt(components, params.tools, imageTags) + context.toString()
        );

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
                model: capability.model,
                connection: capability.connection,
                system,
                toolChoice: "auto",
                prompt: params.prompt + formatAdditionalFilesContext(context.additionalFiles),
                ...(Object.keys(sdkTools).length > 0
                    ? { tools: sdkTools, stopWhen: stepCountIs(20) }
                    : {})
            });

            const text =
                aiResult.text ||
                (aiResult.steps.filter(step => step.text.length > 0).pop()?.text ?? "");

            const elements = LlmJsonResponse.fromRawText(text).toArray();
            const componentFilter = new ComponentFilter(components);
            const output = JSON.stringify(componentFilter.filter(elements));

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
                totalSteps: aiResult.steps.length,
                toolsAvailable: Object.keys(sdkTools),
                imageTagsInPrompt: imageTags
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
        dependencies: [
            AiPromptContextBuilder,
            ResolveAiCapabilityUseCase,
            Ai,
            AiSdkTools,
            ListTagsUseCase
        ]
    });
