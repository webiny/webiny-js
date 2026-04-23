import { z } from "zod";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { Masker } from "@webiny/api-core/features/masker/index.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { PersistedProviderPreset, PersistedProviders, ProvidersSettings } from "./types.js";

const inputSchema = z.object({
    presets: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            description: z.string().optional(),
            model: z.string().min(1),
            apiKey: z.string().optional()
        })
    )
});

class ProvidersHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "providers";
    readonly inputSchema = inputSchema;

    constructor(
        private encryption: Encryption.Interface,
        private masker: Masker.Interface
    ) {}

    mapFromStorage(persisted: unknown): ProvidersSettings {
        if (!persisted || typeof persisted !== "object") {
            return { presets: [] };
        }

        const data = persisted as PersistedProviders;
        const presets = (data.presets ?? []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            model: p.model,
            apiKeyMasked: p.apiKeyMasked ?? "",
            apiKeyEncrypted: p.apiKeyEncrypted ?? ""
        }));

        return { presets };
    }

    async mapToStorage(internal: unknown, existing: unknown | null): Promise<PersistedProviders> {
        const input = internal as ProvidersSettings;
        const existingData = existing as ProvidersSettings | null;
        const existingPresets = existingData?.presets ?? [];

        const presets: PersistedProviderPreset[] = await Promise.all(
            input.presets.map(async preset => {
                const existingMatch = existingPresets.find(ep => ep.id === preset.id);

                let apiKeyEncrypted: string;
                let apiKeyMasked: string;

                if (!preset.apiKey || preset.apiKey === existingMatch?.apiKeyMasked) {
                    // Carry forward existing encrypted key
                    apiKeyEncrypted = existingMatch?.apiKeyEncrypted ?? "";
                    apiKeyMasked = existingMatch?.apiKeyMasked ?? "";
                } else {
                    // New plaintext key — encrypt and mask
                    apiKeyEncrypted = this.encryption.encrypt(preset.apiKey);
                    apiKeyMasked = this.masker.mask(preset.apiKey);
                }

                return {
                    id: preset.id,
                    name: preset.name,
                    description: preset.description,
                    model: preset.model,
                    apiKeyEncrypted,
                    apiKeyMasked
                };
            })
        );

        return { presets };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ProvidersHandlerImpl,
    dependencies: [Encryption, Masker]
});
