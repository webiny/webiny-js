import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface ProjectFileItem {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    src: string;
    width?: number;
    height?: number;
}

export interface ProjectPreset {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    defaultReaderPersonaId?: string;
    defaultWriterPersonaId?: string;
    files?: ProjectFileItem[];
    version: number;
}

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        projects: {
            presets: ProjectPreset[];
        };
    }
}

export type ProjectsSettings = IAiPowerUpsSettings["projects"];

export interface PersistedProjectFileItem {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    src: string;
    width?: number;
    height?: number;
}

export interface PersistedProjectPreset {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    defaultReaderPersonaId?: string;
    defaultWriterPersonaId?: string;
    files?: PersistedProjectFileItem[];
    version: number;
}

export interface PersistedProjects {
    presets: PersistedProjectPreset[];
}
