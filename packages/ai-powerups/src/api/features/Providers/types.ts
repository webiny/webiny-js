import type { IAiPowerUpsSettings } from "../../types.js";

export interface ProviderPreset {
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKey?: string;
    apiKeyMasked: string;
    apiKeyEncrypted: string;
}

declare module "../../types.js" {
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
