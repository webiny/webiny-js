import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface ReaderPersonaPreset {
    id: string;
    name: string;
    description: string;
    style?: string;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        readerPersonas: {
            presets: ReaderPersonaPreset[];
        };
    }
}

export type ReaderPersonasSettings = IAiPowerUpsSettings["readerPersonas"];

export interface PersistedReaderPersonaPreset {
    id: string;
    name: string;
    description: string;
    style?: string;
}

export interface PersistedReaderPersonas {
    presets: PersistedReaderPersonaPreset[];
}
