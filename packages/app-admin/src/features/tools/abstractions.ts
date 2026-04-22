import type { z } from "zod";
import { createAbstraction } from "@webiny/feature/admin";

export interface ITool<
    TInput extends z.ZodType = z.ZodType,
    TOutput extends z.ZodType = z.ZodType
> {
    name: string;
    description: string;
    inputSchema: TInput;
    outputSchema: TOutput;
    execute(input: z.infer<TInput>): Promise<z.infer<TOutput>>;
}

export const Tool = createAbstraction<ITool>("Tool");

export namespace Tool {
    export type Interface<
        TInput extends z.ZodType = z.ZodType,
        TOutput extends z.ZodType = z.ZodType
    > = ITool<TInput, TOutput>;
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
