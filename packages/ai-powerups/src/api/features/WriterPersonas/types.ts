import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface WriterPersonaPreset {
    id: string;
    name: string;
    description: string;
    style?: string;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        writerPersonas: {
            presets: WriterPersonaPreset[];
        };
    }
}

export type WriterPersonasSettings = IAiPowerUpsSettings["writerPersonas"];

export interface PersistedWriterPersonaPreset {
    id: string;
    name: string;
    description: string;
    style?: string;
}

export interface PersistedWriterPersonas {
    presets: PersistedWriterPersonaPreset[];
}
