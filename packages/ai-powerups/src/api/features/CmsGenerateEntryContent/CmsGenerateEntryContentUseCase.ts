import { stepCountIs } from "ai";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { AiToolPipelineRunner } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { ListTagsUseCase } from "@webiny/api-file-manager/features/file/ListTags/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";
import { CmsModelToJsonSchemaConverter } from "@webiny/api-headless-cms/utils/contentModelToJsonSchema/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import {
    AiPromptContextBuilder,
    formatAdditionalFilesContext
} from "~/api/features/AiPromptContext/index.js";
import { createReadProjectFileTool } from "~/api/features/AiPromptContext/ReadProjectFileTool.js";
import { CmsGenerateEntryContentUseCase } from "./abstractions.js";
import type {
    CmsGenerateEntryContentParams,
    GenerateEntryContentResult,
    GenerateEntryContentTelemetry
} from "./abstractions.js";
import { buildEntryPrompt } from "./buildPrompt.js";
import { LlmJsonResponse } from "../WbGeneratePageContent/LlmJsonResponse.js";
import { injectDynamicZoneTypenames } from "./injectDynamicZoneTypenames.js";

class CmsGenerateEntryContentUseCaseImpl implements CmsGenerateEntryContentUseCase.Interface {
    constructor(
        private promptContextBuilder: AiPromptContextBuilder.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private ai: Ai.Interface,
        private aiSdkTools: AiSdkTools.Interface,
        private encryption: Encryption.Interface,
        private listTags: ListTagsUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private modelToAst: ModelToAstConverter.Interface,
        private toolPipelineRunner: AiToolPipelineRunner.Interface
    ) {}

    async execute(
        params: CmsGenerateEntryContentParams
    ): Promise<Result<GenerateEntryContentResult, Error>> {
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

        const modelResult = await this.getModel.execute(params.modelId);
        if (modelResult.isFail()) {
            return Result.fail(new Error(`Content model "${params.modelId}" not found.`));
        }

        const model = modelResult.value;
        const modelAst = this.modelToAst.toAst(model);
        const jsonSchemaConverter = new CmsModelToJsonSchemaConverter();
        const entrySchema = jsonSchemaConverter.convert(modelAst, {
            name: model.name,
            description: model.description
        });

        const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);
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

        const tagsResult = await this.listTags.execute({
            where: { type_startsWith: "image/" },
            limit: 100
        });
        const imageTags = tagsResult.isOk() ? tagsResult.value.map(t => t.tag) : [];

        const systemText =
            buildEntryPrompt(model.name, entrySchema, imageTags) + context.toString();

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
                prompt: params.prompt + formatAdditionalFilesContext(context.additionalFiles),
                ...(Object.keys(sdkTools).length > 0
                    ? { tools: sdkTools, stopWhen: stepCountIs(20) }
                    : {})
            });

            const text =
                aiResult.text ||
                (aiResult.steps.filter(step => step.text.length > 0).pop()?.text ?? "");

            const entry = LlmJsonResponse.fromRawText(text).toArray().pop();

            let resolved: Record<string, any> | undefined;

            if (entry) {
                resolved = (await this.toolPipelineRunner.resolve(entry)) as Record<string, any>;
                await injectDynamicZoneTypenames(resolved, modelAst, model.singularApiName);
            }

            const output = JSON.stringify(resolved);

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

            const telemetry: GenerateEntryContentTelemetry = {
                filesRead: [...filesRead],
                cacheHit: context.cacheHit,
                toolCallsMade,
                totalSteps: aiResult.steps.length,
                toolsAvailable: Object.keys(sdkTools),
                imageTagsInPrompt: imageTags
            };

            return Result.ok({ output, values: resolved ?? {}, telemetry });
        } catch (error) {
            return Result.fail(
                new Error(
                    `AI generation failed: ${error instanceof Error ? error.message : String(error)}`
                )
            );
        }
    }
}

export const CmsGenerateEntryContentUseCaseImplementation =
    CmsGenerateEntryContentUseCase.createImplementation({
        implementation: CmsGenerateEntryContentUseCaseImpl,
        dependencies: [
            AiPromptContextBuilder,
            GetSettingsUseCase,
            Ai,
            AiSdkTools,
            Encryption,
            ListTagsUseCase,
            GetModelUseCase,
            ModelToAstConverter,
            AiToolPipelineRunner
        ]
    });
