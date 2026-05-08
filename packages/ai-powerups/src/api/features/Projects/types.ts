import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface ProjectPreset {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    defaultReaderPersonaId?: string;
    defaultWriterPersonaId?: string;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        projects: {
            presets: ProjectPreset[];
        };
    }
}

export type ProjectsSettings = IAiPowerUpsSettings["projects"];

export interface PersistedProjectPreset {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    defaultReaderPersonaId?: string;
    defaultWriterPersonaId?: string;
}

export interface PersistedProjects {
    presets: PersistedProjectPreset[];
}
