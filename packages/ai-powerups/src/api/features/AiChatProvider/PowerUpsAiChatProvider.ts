import { AiChatProvider as Abstraction } from "@webiny/ai-chat/api/index.js";
import type { IAiChatProviderResolution } from "@webiny/ai-chat/api/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";

/**
 * Runs the assistant on the provider configured in AI Power-Ups settings.
 *
 * Overrides the environment-variable default so the model and its key are managed where every other
 * AI feature in the project already manages them — in the admin UI, per tenant, with the key
 * encrypted at rest. Same source `CmsGenerateEntryContent` and `CmsCompareEntryRevisions` read.
 *
 * Uses the FIRST configured provider, matching the other AI Power-Ups use cases. Picking per-feature
 * providers is a settings design question, not something to invent here.
 */
class PowerUpsAiChatProviderImpl implements Abstraction.Interface {
    constructor(
        private readonly getSettings: GetSettingsUseCase.Interface,
        private readonly encryption: Encryption.Interface
    ) {}

    async resolve(): Promise<IAiChatProviderResolution> {
        const settingsResult = await this.getSettings.execute();

        if (settingsResult.isFail()) {
            throw new Error("Failed to load AI Power Ups settings.");
        }

        const provider = settingsResult.value.providers.presets[0];

        if (!provider) {
            throw new Error(
                "No AI provider configured. Add one under Settings → AI Power-Ups → Providers."
            );
        }

        if (!provider.model) {
            throw new Error(
                `The AI provider "${provider.name}" has no model selected. Pick one under Settings → AI Power-Ups → Providers.`
            );
        }

        /*
         * A row can exist before a key is entered. Erroring here is deliberate: falling back to an
         * environment variable when a provider IS configured is what made the previous behaviour so
         * hard to reason about — the settings screen said one thing and the request used another.
         */
        if (!provider.apiKeyEncrypted) {
            throw new Error(
                `The AI provider "${provider.name}" has no API key. Add one under Settings → AI Power-Ups → Providers.`
            );
        }

        return {
            model: provider.model,
            apiKey: await this.encryption.decrypt(provider.apiKeyEncrypted)
        };
    }
}

export const PowerUpsAiChatProvider = Abstraction.createImplementation({
    implementation: PowerUpsAiChatProviderImpl,
    dependencies: [GetSettingsUseCase, Encryption]
});
