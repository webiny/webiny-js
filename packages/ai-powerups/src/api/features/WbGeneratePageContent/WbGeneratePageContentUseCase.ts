import { stepCountIs } from "ai";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { WbGeneratePageContentUseCase } from "./abstractions.js";
import type { WbGeneratePageContentParams } from "./abstractions.js";
import { buildSystemPrompt } from "./buildPrompt.js";
import { loadProjectFiles } from "./loadProjectFiles.js";

function stripCodeFence(text: string): string {
    return text
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();
}

class WbGeneratePageContentUseCaseImpl implements WbGeneratePageContentUseCase.Interface {
    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private ai: Ai.Interface,
        private aiSdkTools: AiSdkTools.Interface,
        private encryption: Encryption.Interface,
        private keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async execute(params: WbGeneratePageContentParams): Promise<Result<string, Error>> {
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

        // Decrypt at point of use.
        const apiKey = this.encryption.decrypt(firstProvider.apiKeyEncrypted);

        // TODO: configure this in `ai` as default behavior.
        const sdkTools = this.aiSdkTools.getToolSet();

        const project = params.projectId
            ? settings.projects?.presets?.find(p => p.id === params.projectId)
            : undefined;

        const projectFiles = project?.files
            ? await loadProjectFiles(
                  project.id,
                  project.version ?? 0,
                  project.files,
                  params.excludedFileIds,
                  this.keyValueStore
              )
            : [];

        const readerPersona = params.readerPersonaId
            ? settings.readerPersonas?.presets?.find(p => p.id === params.readerPersonaId)
            : undefined;

        const writerPersona = params.writerPersonaId
            ? settings.writerPersonas?.presets?.find(p => p.id === params.writerPersonaId)
            : undefined;

        const systemText = buildSystemPrompt(params.components, params.tools, {
            readerPersona,
            writerPersona,
            project: project
                ? { name: project.name, instructions: project.instructions, files: projectFiles }
                : undefined
        });

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
                    ? { tools: sdkTools, stopWhen: stepCountIs(10) }
                    : {})
            });

            // result.text might be empty if the last step was a tool call.
            // Find the last step that has text content:
            const text =
                aiResult.text ||
                (aiResult.steps.filter(step => step.text.length > 0).pop()?.text ?? "");

            const output = stripCodeFence(text);

            return Result.ok(output);
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
        dependencies: [GetSettingsUseCase, Ai, AiSdkTools, Encryption, GlobalKeyValueStore]
    });
