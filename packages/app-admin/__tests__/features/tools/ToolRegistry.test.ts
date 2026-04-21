import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { z } from "zod";
import { Tool, ToolRegistry as ToolRegistryAbstraction } from "~/features/tools/abstractions";
import { ToolRegistry } from "~/features/tools/ToolRegistry";
import type { ITool } from "~/features/tools/abstractions";

function createTool(overrides: Partial<ITool> & Pick<ITool, "name">): ITool {
    return {
        description: `A ${overrides.name} tool`,
        inputSchema: z.object({ value: z.string() }),
        execute: async (input: unknown) => {
            const { value } = input as { value: string };
            return { result: value.toUpperCase() };
        },
        ...overrides
    };
}

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
    return container.resolve(ToolRegistryAbstraction);
}

describe("ToolRegistry", () => {
    it("should return all registered tools", () => {
        const registry = setup(createTool({ name: "a" }), createTool({ name: "b" }));
        expect(registry.getTools()).toHaveLength(2);
    });

    it("should get a tool by name", () => {
        const registry = setup(createTool({ name: "myTool" }));
        const tool = registry.getTool("myTool");
        expect(tool.name).toBe("myTool");
    });

    it("should throw when getting an unregistered tool", () => {
        const registry = setup();
        expect(() => registry.getTool("nonexistent")).toThrow(
            'Tool "nonexistent" is not registered.'
        );
    });

    it("should invoke a tool with input validation", async () => {
        const registry = setup(createTool({ name: "upper" }));
        const result = await registry.invoke("upper", { value: "hello" });
        expect(result).toEqual({ result: "HELLO" });
    });

    it("should reject invalid input via Zod", async () => {
        const registry = setup(createTool({ name: "upper" }));
        await expect(registry.invoke("upper", { value: 123 })).rejects.toThrow();
    });
});
