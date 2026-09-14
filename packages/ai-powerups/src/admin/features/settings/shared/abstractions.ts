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
        /** Keyed by role id, and every role always present — the set is closed. */
        roles: Record<AiModelRoleId, { connectionId: string; model: string }>;
    };
    capabilities: {
        /**
         * Keyed by capability id, and open-ended: extensions register their own, so there is no
         * union to enumerate. `Partial` because most capabilities have no override, and a bare
         * `Record` would type a miss as present.
         */
        overrides: Partial<Record<string, IAiPowerUpsCapabilityOverride>>;
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
