import { createAbstraction } from "@webiny/feature/admin";

export interface IAiPromptInput {
    role: string;
    content: string;
}

export type IAiPromptOutput = Promise<string>;

export interface IAiPrompt {
    prompt(input: IAiPromptInput[]): Promise<string>;
}

export const AiPrompt = createAbstraction<IAiPrompt>("AiPromptService");

export namespace AiPrompt {
    export type Interface = IAiPrompt;
    export type Input = IAiPromptInput;
    export type Output = IAiPromptOutput;
}

// Repository
export interface IAiPromptRepository {
    prompt(input: IAiPromptInput[]): Promise<string>;
}

export const AiPromptRepository = createAbstraction<IAiPromptRepository>("AiPrompt/Repository");
export namespace AiPromptRepository {
    export type Interface = IAiPromptRepository;
}

// Gateway
export interface IAiPromptGateway {
    prompt(input: IAiPromptInput[]): Promise<string>;
}

export const AiPromptGateway = createAbstraction<IAiPromptGateway>("AiPrompt/Gateway");
export namespace AiPromptGateway {
    export type Interface = IAiPromptGateway;
}
