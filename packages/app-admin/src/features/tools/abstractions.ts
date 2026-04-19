import type { z } from "zod";
import { createAbstraction } from "@webiny/feature/admin";

export interface ITool {
    name: string;
    description: string;
    inputSchema: z.ZodType;
    execute(input: unknown): Promise<unknown>;
}

export const Tool = createAbstraction<ITool>("Tool");

export namespace Tool {
    export type Interface = ITool;
}

export interface IToolRegistry {
    getTool(name: string): ITool;
    getTools(): ITool[];
    invoke(name: string, params: unknown): Promise<unknown>;
}

export const ToolRegistry = createAbstraction<IToolRegistry>("ToolRegistry");

export namespace ToolRegistry {
    export type Interface = IToolRegistry;
}

export interface IToolPipelineRunner {
    resolve(data: unknown): Promise<unknown>;
}

export const ToolPipelineRunner = createAbstraction<IToolPipelineRunner>("ToolPipelineRunner");

export namespace ToolPipelineRunner {
    export type Interface = IToolPipelineRunner;
}
