import {
    AiSdkToolDefinition,
    AiSdkToolHandlerResolver,
    AiSdkTools as AiSdkToolsAbstraction
} from "./abstractions.js";
import type { ToolSet } from "ai";

class AiSdkToolsImpl implements AiSdkToolsAbstraction.Interface {
    constructor(
        private definitions: AiSdkToolDefinition.Interface[],
        private resolver: AiSdkToolHandlerResolver.Interface
    ) {}

    getToolSet(): ToolSet {
        const map: ToolSet = {};
        for (const definition of this.definitions) {
            map[definition.name] = {
                description: definition.description,
                inputSchema: definition.inputSchema,
                /*
                 * Deliberately resolved inside the call, not here. The model is offered every tool
                 * and calls at most a few, so this is what keeps the other tools' use cases unbuilt.
                 */
                execute: (input: unknown) =>
                    this.resolver.resolve(definition.handler).execute(input)
            };
        }
        return map;
    }
}

export const AiSdkTools = AiSdkToolsAbstraction.createImplementation({
    implementation: AiSdkToolsImpl,
    dependencies: [[AiSdkToolDefinition, { multiple: true }], AiSdkToolHandlerResolver]
});
