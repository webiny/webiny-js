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

export interface IAiPowerUpsSettings {
    providers: {
        presets: {
            name: string;
            description: string;
            model: string;
            apiKey: string;
        }[];
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
        }[];
    };
}
