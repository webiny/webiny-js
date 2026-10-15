import { createFeature } from "@webiny/feature/admin";
import { DebugSessionsRepository as Abstraction } from "./abstractions.js";
import { DebugSessionsRepository } from "./DebugSessionsRepository.js";
import { GraphQLExtensionsDebugHandler } from "./GraphQLExtensionsDebugHandler.js";

export const DebuggerFeature = createFeature({
    name: "Debugger",
    register(container) {
        // Singleton: the handler writes to it and the panel and header indicator read from it.
        container.register(DebugSessionsRepository).inSingletonScope();
        container.register(GraphQLExtensionsDebugHandler).inSingletonScope();
    },
    resolve(container) {
        return {
            repository: container.resolve(Abstraction)
        };
    }
});
