export interface AiProvider {
    name: string;
    description?: string;
    model: string;
    apiKey: string;
}

export interface AiPersona {
    name: string;
    description: string;
}

export interface AiPowerupsSettings {
    providers: AiProvider[];
    personas: AiPersona[];
}
