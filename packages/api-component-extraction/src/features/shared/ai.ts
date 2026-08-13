import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "@webiny/ai-powerups/exports/api/ai-powerups.js";
import {
    ExtractionModelError,
    ExtractionValidationError,
    type ExtractionError
} from "~/domain/errors.js";

/**
 * The shared AI entry point for the model-backed stages (Classify, Plan). Generate goes through
 * remote-components' generation path, so token accounting is NOT done here — it is captured for all
 * three stages uniformly by subscribing to the core `Ai`'s events (see `ModelCallRecorder`), which is
 * the one point every model call funnels through.
 *
 * It centralises the provider selection that `GenerateRemoteComponentUseCase` does inline: read the AI
 * Power-Ups settings, take the first configured provider preset, decrypt its key, and call the `Ai`
 * abstraction. A "not configured" is a validation error (the user must fix it); a call/parse failure is
 * a model error (transient, a caller may retry or degrade).
 */
export interface AiTextPart {
    type: "text";
    text: string;
}
export interface AiFilePart {
    type: "file";
    data: Uint8Array;
    mediaType: string;
}
export type AiContentPart = AiTextPart | AiFilePart;

export interface AiMessage {
    role: "user" | "assistant";
    content: string | AiContentPart[];
}

export interface IComponentExtractionAi {
    generate(params: {
        system?: string;
        messages: AiMessage[];
    }): Promise<Result<string, ExtractionError>>;
}

export const ComponentExtractionAi =
    createAbstraction<IComponentExtractionAi>("ComponentExtraction/Ai");
export namespace ComponentExtractionAi {
    export type Interface = IComponentExtractionAi;
}

interface ProviderPreset {
    model: string;
    apiKeyEncrypted: string;
}

class ComponentExtractionAiImpl implements IComponentExtractionAi {
    constructor(
        private ai: Ai.Interface,
        private encryption: Encryption.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {}

    async generate({
        system,
        messages
    }: {
        system?: string;
        messages: AiMessage[];
    }): Promise<Result<string, ExtractionError>> {
        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return Result.fail(
                new ExtractionValidationError(
                    "could not load AI settings; configure a provider in AI Power Ups"
                )
            );
        }

        const settings = settingsResult.value as {
            providers?: { presets?: ProviderPreset[] };
        };
        const preset = settings.providers?.presets?.[0];
        if (!preset) {
            return Result.fail(
                new ExtractionValidationError(
                    "no AI provider configured; add one in AI Power Ups settings"
                )
            );
        }

        let apiKey: string;
        try {
            apiKey = await this.encryption.decrypt(preset.apiKeyEncrypted);
        } catch {
            return Result.fail(
                new ExtractionValidationError("could not decrypt the AI provider key")
            );
        }

        try {
            const result = await this.ai.generateText({
                model: preset.model,
                connection: { sdkName: preset.model.split("/")[0], apiKey },
                system,
                messages
            } as Parameters<Ai.Interface["generateText"]>[0]);

            const steps = (result.steps ?? []) as Array<{ text?: string }>;
            const text =
                result.text ||
                steps.filter(step => step.text && step.text.length > 0).pop()?.text ||
                "";

            if (!text) {
                return Result.fail(
                    new ExtractionModelError("the model returned an empty response")
                );
            }
            return Result.ok(text);
        } catch (error) {
            return Result.fail(
                new ExtractionModelError(error instanceof Error ? error.message : String(error))
            );
        }
    }
}

export const ComponentExtractionAiService = createImplementation({
    abstraction: ComponentExtractionAi,
    implementation: ComponentExtractionAiImpl,
    dependencies: [Ai, Encryption, GetSettingsUseCase]
});
