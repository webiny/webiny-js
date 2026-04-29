import { AiSdkTool, AiSdkTools as AiSdkToolsAbstraction } from "./abstractions.js";
import type { ToolSet } from "ai";

class AiSdkToolsImpl implements AiSdkToolsAbstraction.Interface {
    constructor(private tools: AiSdkTool.Interface[]) {}

    getToolSet(): ToolSet {
        const map: ToolSet = {};
        for (const t of this.tools) {
            map[t.name] = {
                description: t.description,
                inputSchema: t.inputSchema,
                execute: (input: unknown) => t.execute(input)
            };
        }
        return map;
    }
}

export const AiSdkTools = AiSdkToolsAbstraction.createImplementation({
    implementation: AiSdkToolsImpl,
    dependencies: [[AiSdkTool, { multiple: true }]]
});
