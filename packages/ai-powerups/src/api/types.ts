import "@webiny/tasks/features/TaskController/augmentation.js";

export interface AiProvider {
    name: string;
    description?: string;
    model: string;
    apiKey: string;
}

export interface AiPowerUpsSettings {
    providers: {
        presets: AiProvider[];
    };
}
