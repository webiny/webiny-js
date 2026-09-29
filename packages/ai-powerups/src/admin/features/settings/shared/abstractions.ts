import { createAbstraction } from "@webiny/feature/admin";
import type { AiModelRoleId } from "~/admin/domain/modelRoles.js";

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

/** One vendor credential. The `apiKey` is only ever the mask; the plaintext never leaves the api. */
export interface IAiPowerUpsConnectionPreset {
    id: string;
    name: string;
    sdkName: string;
    apiKey: string;
}

export interface IAiPowerUpsModelRoleAssignment {
    connectionId: string;
    model: string;
}

/** A file attached to a project, as the picker returns it. */
export interface IAiPowerUpsProjectFile {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    src: string;
    width?: number;
    height?: number;
}

export interface IAiPowerUpsProjectPreset {
    id: string;
    name: string;
    description?: string;
    instructions?: string;
    defaultReaderPersonaId?: string;
    defaultWriterPersonaId?: string;
    files?: IAiPowerUpsProjectFile[];
    version: number;
}

/** What a project decided about one capability. Absent `enabled` means enabled. */
export interface IAiPowerUpsCapabilityEntry {
    enabled?: boolean;
    overrides: IAiPowerUpsCapabilityOverride;
}

export interface IAiPowerUpsCapabilityOverride {
    roleId?: string;
    connectionId?: string;
    model?: string;
    additionalInstructions?: string;
}

export interface IAiPowerUpsSettings {
    connections: {
        presets: IAiPowerUpsConnectionPreset[];
    };
    modelRoles: {
        /** Keyed by role id, and every role always present — the set is closed. */
        roles: Record<AiModelRoleId, IAiPowerUpsModelRoleAssignment>;
    };
    capabilities: {
        /**
         * Keyed by capability id, and open-ended: extensions register their own, so there is no
         * union to enumerate. `Partial` because most capabilities are untouched, and a bare
         * `Record` would type a miss as present.
         */
        items: Partial<Record<string, IAiPowerUpsCapabilityEntry>>;
    };
    readerPersonas: {
        presets: IAiPowerUpsPersonaPreset[];
    };
    writerPersonas: {
        presets: IAiPowerUpsPersonaPreset[];
    };
    projects: {
        presets: IAiPowerUpsProjectPreset[];
    };
}
