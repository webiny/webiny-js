import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface ProviderPreset {
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKey?: string;
    apiKeyMasked: string;
    apiKeyEncrypted: string;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        providers: {
            presets: ProviderPreset[];
        };
    }
}

export type ProvidersSettings = IAiPowerUpsSettings["providers"];

export interface PersistedProviderPreset {
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKeyEncrypted: string;
    apiKeyMasked: string;
}

export interface PersistedProviders {
    presets: PersistedProviderPreset[];
}
