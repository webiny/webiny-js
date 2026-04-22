import { stepCountIs } from "ai";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { WbGeneratePageContentUseCase } from "./abstractions.js";
import type { WbGeneratePageContentParams } from "./abstractions.js";
import { buildSystemPrompt } from "./buildPrompt.js";

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
        private aiSdkTools: AiSdkTools.Interface
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

        // TODO: configure this in `ai` as default behavior.
        const sdkTools = this.aiSdkTools.getToolSet();

        const system = buildSystemPrompt(params.components, params.tools);

        try {
            const aiResult = await this.ai.generateText({
                model: firstProvider.model,
                connection: {
                    sdkName: firstProvider.model.split("/")[0],
                    apiKey: firstProvider.apiKey
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
        dependencies: [GetSettingsUseCase, Ai, AiSdkTools]
    });
