import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { z } from "zod";
import {
    Tool,
    ToolPipelineRunner as PipelineRunnerAbstraction
} from "~/features/tools/abstractions";
import { ToolRegistry } from "~/features/tools/ToolRegistry";
import { ToolPipelineRunner } from "~/features/tools/ToolPipelineRunner.js";
import type { ITool } from "~/features/tools/abstractions";

function createToolImplementation(tool: ITool) {
    class ToolImpl implements ITool {
        name = tool.name;
        description = tool.description;
        inputSchema = tool.inputSchema;
        execute = tool.execute;
    }

    return Tool.createImplementation({
        implementation: ToolImpl,
        dependencies: []
    });
}

function setup(...tools: ITool[]) {
    const container = new Container();
    for (const tool of tools) {
        container.register(createToolImplementation(tool));
    }
    container.register(ToolRegistry);
    container.register(ToolPipelineRunner);
    return container.resolve(PipelineRunnerAbstraction);
}

const upperTool: ITool = {
    name: "upper",
    description: "Uppercases a string",
    inputSchema: z.object({ text: z.string() }),
    execute: async (input: unknown) => {
        const { text } = input as { text: string };
        return { result: text.toUpperCase() };
    }
};

const wrapTool: ITool = {
    name: "wrap",
    description: "Wraps text in brackets",
    inputSchema: z.object({ text: z.string() }),
    execute: async (input: unknown) => {
        const { text } = input as { text: string };
        return { result: `[${text}]` };
    }
};

describe("PipelineRunner", () => {
    it("should pass through primitives", async () => {
        const runner = setup();
        expect(await runner.resolve("hello")).toBe("hello");
        expect(await runner.resolve(42)).toBe(42);
        expect(await runner.resolve(true)).toBe(true);
        expect(await runner.resolve(null)).toBe(null);
        expect(await runner.resolve(undefined)).toBe(undefined);
    });

    it("should pass through plain objects without envelopes", async () => {
        const runner = setup();
        const data = { a: 1, b: "two", c: { nested: true } };
        expect(await runner.resolve(data)).toEqual(data);
    });

    it("should resolve a tool envelope", async () => {
        const runner = setup(upperTool);
        const data = { tool: "upper", params: { text: "hello" } };
        expect(await runner.resolve(data)).toEqual({ result: "HELLO" });
    });

    it("should resolve envelopes nested in objects", async () => {
        const runner = setup(upperTool);
        const data = {
            title: "My Page",
            content: { tool: "upper", params: { text: "hello" } }
        };
        expect(await runner.resolve(data)).toEqual({
            title: "My Page",
            content: { result: "HELLO" }
        });
    });

    it("should resolve envelopes in arrays", async () => {
        const runner = setup(upperTool);
        const data = [
            { tool: "upper", params: { text: "a" } },
            { tool: "upper", params: { text: "b" } }
        ];
        expect(await runner.resolve(data)).toEqual([{ result: "A" }, { result: "B" }]);
    });

    it("should resolve multiple different tools", async () => {
        const runner = setup(upperTool, wrapTool);
        const data = {
            first: { tool: "upper", params: { text: "hello" } },
            second: { tool: "wrap", params: { text: "world" } }
        };
        expect(await runner.resolve(data)).toEqual({
            first: { result: "HELLO" },
            second: { result: "[world]" }
        });
    });

    it("should resolve nested envelopes in tool output", async () => {
        const nestedTool: ITool = {
            name: "nested",
            description: "Returns an envelope",
            inputSchema: z.object({}),
            execute: async () => {
                return { tool: "upper", params: { text: "from nested" } };
            }
        };

        const runner = setup(upperTool, nestedTool);
        const data = { tool: "nested", params: {} };
        expect(await runner.resolve(data)).toEqual({ result: "FROM NESTED" });
    });

    it("should handle deeply nested structures", async () => {
        const runner = setup(upperTool);
        const data = {
            level1: {
                level2: {
                    level3: { tool: "upper", params: { text: "deep" } }
                }
            }
        };
        expect(await runner.resolve(data)).toEqual({
            level1: { level2: { level3: { result: "DEEP" } } }
        });
    });
});
