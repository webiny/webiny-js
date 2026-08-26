interface Preset {
    setupFiles?: string[];
    setupFilesAfterEnv?: string[];
}

export function getPresets(...keywords: string[][]): Promise<Preset[]>;
