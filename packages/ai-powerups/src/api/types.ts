export interface AiProvider {
    name: string;
    description?: string;
    model: string;
    apiKey: string;
}

export interface AiPowerupsSettings {
    providers: AiProvider[];
}
