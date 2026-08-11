import { createFeature, Result, Encryption } from "webiny/api";
import { GetSettingsUseCase } from "webiny/api/ai-powerups";
import {
    ExtractionSettings,
    ExtractionNotConfiguredError,
    ThemeExtractionFeature
} from "webiny/api/theme-extraction";

/**
 * The slice of AI Power-Ups settings we read.
 *
 * `IAiPowerUpsSettings` gains its `providers` field through module augmentation *inside* the AI
 * Power-Ups package, and that augmentation isn't visible from an extension that only imports
 * `GetSettingsUseCase`. So we state the shape we depend on here — the same `presets[0]` the other AI
 * features read at runtime.
 */
interface AiPowerUpsSettingsShape {
    providers?: {
        presets?: Array<{ model: string; apiKeyEncrypted: string }>;
    };
}

/**
 * Enables theme extraction (generate a theme from a website) on this project.
 *
 * The extraction backend — `@webiny/api-theme-extraction` — ships everything (crawler, AI analysis,
 * background task, GraphQL schema) except one decision the framework can't make: *which* AI model to
 * use, and over which connection. This extension does two things:
 *
 *   1. Registers `ThemeExtractionFeature`, so its schema and task actually load. Without this, the
 *      Admin's "generate from a website" call fails with `Unknown type "ThemeExtractionInput"`.
 *   2. Fills the open `ExtractionSettings` seam by pointing extraction at the *same* AI provider the
 *      rest of the Admin uses — the one configured under AI Power-Ups settings — so there is one place
 *      to set up AI, not one per feature (the same pattern as AI Image Enhance and AI page generation).
 *
 * The API key never leaves this class: AI Power-Ups stores it encrypted, and it is decrypted into an
 * inline connection only at call time. The extraction package only ever receives `{ model, connection }`.
 *
 * Everything here is imported from the `webiny` package (extensions may not import `@webiny/*`
 * directly). Prerequisite: register this extension in `webiny.config.tsx` and configure a provider in
 * AI Power-Ups settings.
 */
class AiPowerUpsExtractionSettings implements ExtractionSettings.Interface {
    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private encryption: Encryption.Interface
    ) {}

    async getModel() {
        const settings = await this.getSettings.execute();
        if (settings.isFail()) {
            // GetSettings' Result carries no typed error, so there is no message to forward here.
            return Result.fail(
                new ExtractionNotConfiguredError("the AI Power-Ups settings could not be read")
            );
        }

        // The first configured provider — the one the other AI features use too (see AI Power-Ups'
        // AiImageEnrichmentTask / CmsGenerateEntryContentTask, which read presets[0] the same way).
        const preset = (settings.value as AiPowerUpsSettingsShape).providers?.presets?.[0];
        if (!preset) {
            return Result.fail(
                new ExtractionNotConfiguredError(
                    "no AI provider is set up in AI Power-Ups settings"
                )
            );
        }

        return Result.ok({
            model: preset.model,
            // Inline, not a named connection: the provider is configured in AI Power-Ups, not in
            // api-core's connection registry. `sdkName` is the model's provider segment (e.g.
            // "anthropic" from "anthropic/claude-sonnet-4-5").
            connection: {
                sdkName: preset.model.split("/")[0],
                apiKey: await this.encryption.decrypt(preset.apiKeyEncrypted)
            }
        });
    }
}

const AiPowerUpsExtractionSettingsImpl = ExtractionSettings.createImplementation({
    implementation: AiPowerUpsExtractionSettings,
    dependencies: [GetSettingsUseCase, Encryption]
});

export default createFeature({
    name: "MyApp/ThemeExtraction",
    register(container) {
        // The built-but-unregistered extraction backend: crawler, analysis, task, GraphQL schema.
        ThemeExtractionFeature.register(container);
        // The one seam it leaves open — which model + connection to use.
        container.register(AiPowerUpsExtractionSettingsImpl);
    }
});
