import { createAbstraction } from "@webiny/feature/api";

export interface IAiOutputTool {
    readonly name: string;
    execute(params: Record<string, unknown>): Promise<unknown>;
}

export const AiOutputTool = createAbstraction<IAiOutputTool>("AiOutputTool");

export namespace AiOutputTool {
    export type Interface = IAiOutputTool;
}

export interface IAiOutputToolRegistry {
    has(name: string): boolean;
    invoke(name: string, params: Record<string, unknown>): Promise<unknown>;
}

export const AiOutputToolRegistry =
    createAbstraction<IAiOutputToolRegistry>("AiOutputToolRegistry");

export namespace AiOutputToolRegistry {
    export type Interface = IAiOutputToolRegistry;
}

export interface IAiToolPipelineRunner {
    resolve(data: unknown): Promise<unknown>;
}

export const AiToolPipelineRunner =
    createAbstraction<IAiToolPipelineRunner>("AiToolPipelineRunner");

export namespace AiToolPipelineRunner {
    export type Interface = IAiToolPipelineRunner;
}
