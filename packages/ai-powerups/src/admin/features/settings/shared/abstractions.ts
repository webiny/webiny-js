import { createAbstraction } from "@webiny/feature/admin";

export interface IAiPowerUpsSettingsCache {
    get(): IAiPowerUpsSettings | null;
    set(data: IAiPowerUpsSettings): void;
}

export const SettingsCache = createAbstraction<IAiPowerUpsSettingsCache>(
    "AiPowerUps/SettingsCache"
);
export namespace SettingsCache {
    export type Interface = IAiPowerUpsSettingsCache;
}

export interface IAiPowerUpsPersonaPreset {
    id: string;
    name: string;
    description: string;
    style?: string;
}

export interface IAiPowerUpsCapabilityOverride {
    roleId?: string;
    connectionId?: string;
    model?: string;
    additionalInstructions?: string;
}

export interface IAiPowerUpsSettings {
    connections: {
        presets: {
            id: string;
            name: string;
            sdkName: string;
            apiKey: string;
        }[];
    };
    modelRoles: {
        roles: Record<string, { connectionId: string; model: string }>;
    };
    capabilities: {
        overrides: Record<string, IAiPowerUpsCapabilityOverride>;
    };
    readerPersonas: {
        presets: IAiPowerUpsPersonaPreset[];
    };
    writerPersonas: {
        presets: IAiPowerUpsPersonaPreset[];
    };
    projects: {
        presets: {
            id: string;
            name: string;
            description?: string;
            instructions?: string;
            defaultReaderPersonaId?: string;
            defaultWriterPersonaId?: string;
            files?: {
                id: string;
                name: string;
                size: number;
                mimeType: string;
                src: string;
                width?: number;
                height?: number;
            }[];
            version: number;
        }[];
    };
}
