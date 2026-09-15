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
                 * Deliberately resolved inside the call, not here. The model is offered every
                 * tool and calls a few, which is what keeps the rest of their use cases unbuilt.
                 *
                 * `resolve` IS `container.resolveImplementation`, one layer down. It lives behind
                 * an abstraction so this class does not inject a container. Note it builds the
                 * class the definition names; resolving the `AiSdkToolHandler` abstraction would
                 * find nothing, since handlers are declared through it but never registered.
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
