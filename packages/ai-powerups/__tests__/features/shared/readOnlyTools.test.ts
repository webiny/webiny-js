import { describe, it, expect } from "vitest";
import type { ToolSet } from "ai";
import type { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { readOnlyToolSet } from "~/api/features/shared/readOnlyTools.js";

class NoopHandler {
    async execute() {
        return {};
    }
}

const definition = (
    name: string,
    annotations?: AiSdkToolDefinition.Annotations
): AiSdkToolDefinition.Interface => ({
    name,
    description: name,
    inputSchema: {} as AiSdkToolDefinition.Interface["inputSchema"],
    annotations,
    handler: NoopHandler
});

const toolSet = (...names: string[]) =>
    Object.fromEntries(names.map(name => [name, { description: name }])) as unknown as ToolSet;

describe("readOnlyToolSet", () => {
    it("keeps a tool only when its declaration says it is read-only", () => {
        const declarations = [
            definition("listEntries", { readOnlyHint: true }),
            definition("deleteEntry", { readOnlyHint: false, destructiveHint: true }),
            definition("createEntry")
        ];

        const tools = readOnlyToolSet(
            toolSet("listEntries", "deleteEntry", "createEntry"),
            declarations
        );

        expect(Object.keys(tools)).toEqual(["listEntries"]);
    });

    it("drops a tool that has no declaration", () => {
        const tools = readOnlyToolSet(toolSet("undeclared"), []);

        expect(tools).toEqual({});
    });
});
