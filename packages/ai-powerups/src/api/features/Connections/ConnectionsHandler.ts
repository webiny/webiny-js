import { z } from "zod";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { Masker } from "@webiny/api-core/features/masker/index.js";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { readLegacyProviderPresets, sdkNameFromModel } from "./types.js";
import type {
    ConnectionsSettings,
    PersistedAiConnectionPreset,
    PersistedConnections
} from "./types.js";

const inputSchema = z.object({
    presets: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            sdkName: z.string().min(1),
            apiKey: z.string().nullish()
        })
    )
});

class ConnectionsHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "connections";
    readonly inputSchema = inputSchema;

    constructor(
        private encryption: Encryption.Interface,
        private masker: Masker.Interface
    ) {}

    mapFromStorage(persisted: unknown, all?: Record<string, unknown>): ConnectionsSettings {
        if (persisted && typeof persisted === "object") {
            const data = persisted as PersistedConnections;
            return {
                presets: (data.presets ?? []).map(p => ({
                    id: p.id,
                    name: p.name,
                    sdkName: p.sdkName,
                    apiKeyMasked: p.apiKeyMasked ?? "",
                    apiKeyEncrypted: p.apiKeyEncrypted ?? ""
                }))
            };
        }

        /*
         * No `connections` section yet, so derive one from the legacy `providers` presets. The keys
         * are already encrypted in storage, which is why this can be a pure read: nothing has to be
         * re-encrypted, and nothing is written back until the next save.
         *
         * Dropping the model here is safe. `ModelRoles` reads the same legacy section and lifts
         * the first preset's model into the `standard` role, which is the only model the old code
         * ever used.
         */
        return {
            presets: readLegacyProviderPresets(all).map(p => ({
                id: p.id,
                name: p.name,
                sdkName: sdkNameFromModel(p.model),
                apiKeyMasked: p.apiKeyMasked ?? "",
                apiKeyEncrypted: p.apiKeyEncrypted ?? ""
            }))
        };
    }

    async mapToStorage(internal: unknown, existing: unknown | null): Promise<PersistedConnections> {
        const input = internal as ConnectionsSettings;
        const existingPresets = (existing as ConnectionsSettings | null)?.presets ?? [];

        const presets: PersistedAiConnectionPreset[] = await Promise.all(
            input.presets.map(async preset => {
                const existingMatch = existingPresets.find(ep => ep.id === preset.id);

                let apiKeyEncrypted: string;
                let apiKeyMasked: string;

                if (!preset.apiKey || preset.apiKey === existingMatch?.apiKeyMasked) {
                    // The form sends back the mask when the key was left alone. Carry it forward.
                    apiKeyEncrypted = existingMatch?.apiKeyEncrypted ?? "";
                    apiKeyMasked = existingMatch?.apiKeyMasked ?? "";
                } else {
                    apiKeyEncrypted = await this.encryption.encrypt(preset.apiKey);
                    apiKeyMasked = this.masker.mask(preset.apiKey, [8, 4]);
                }

                return {
                    id: preset.id,
                    name: preset.name,
                    sdkName: preset.sdkName,
                    apiKeyEncrypted,
                    apiKeyMasked
                };
            })
        );

        return { presets };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ConnectionsHandlerImpl,
    dependencies: [Encryption, Masker]
});
