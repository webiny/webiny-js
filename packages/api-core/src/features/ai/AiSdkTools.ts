import {
    AiSdkTool,
    AiSdkToolHandlerResolver,
    AiSdkTools as AiSdkToolsAbstraction
} from "./abstractions.js";
import { AiSdkToolNotExecutableError } from "./errors.js";
import type { ToolSet } from "ai";

class AiSdkToolsImpl implements AiSdkToolsAbstraction.Interface {
    constructor(
        private tools: AiSdkTool.Interface[],
        private resolver: AiSdkToolHandlerResolver.Interface
    ) {}

    getToolSet(): ToolSet {
        const map: ToolSet = {};
        for (const tool of this.tools) {
            map[tool.name] = {
                description: tool.description,
                inputSchema: tool.inputSchema,
                execute: (input: unknown) => this.execute(tool, input)
            };
        }
        return map;
    }

    /**
     * Deliberately not resolved up front. The model is offered every tool and calls at most a few,
     * so building a handler here, inside the call, is what keeps the other tools' use cases
     * unbuilt. A tool still carrying its own `execute` runs as before.
     */
    private execute(tool: AiSdkTool.Interface, input: unknown): Promise<unknown> {
        if (tool.handler) {
            const handler = this.resolver.resolve(tool.handler);
            return handler.execute(input);
        }

        if (tool.execute) {
            return tool.execute(input);
        }

        throw new AiSdkToolNotExecutableError(tool.name);
    }
}

export const AiSdkTools = AiSdkToolsAbstraction.createImplementation({
    implementation: AiSdkToolsImpl,
    dependencies: [[AiSdkTool, { multiple: true }], AiSdkToolHandlerResolver]
});
