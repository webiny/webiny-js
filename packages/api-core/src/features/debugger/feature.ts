import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { Debugger } from "./Debugger.js";
import { GraphQLDebuggerTransport } from "./GraphQLDebuggerTransport.js";

export const DebuggerFeature = createFeature({
    name: "DebuggerFeature",
    register(container: Container) {
        /**
         * Must be a singleton. The session is instance state, so a transient registration would give
         * the start plugin, every call site and the flush plugin three different instances - and the
         * failure would be silent: nothing throws, nothing is reported.
         */
        container.register(Debugger).inSingletonScope();
        container.register(GraphQLDebuggerTransport);
    }
});
