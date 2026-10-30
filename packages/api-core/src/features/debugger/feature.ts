import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { Debugger } from "./Debugger.js";
import { GraphQLDebuggerTransport } from "./GraphQLDebuggerTransport.js";
import { DebuggerRouteDecorator } from "./DebuggerRouteDecorator.js";

export const DebuggerFeature = createFeature({
    name: "DebuggerFeature",
    register(container: Container) {
        /*
         * The session is request state, so it is container scoped: one instance per request,
         * shared by the route decorator that opens and flushes it and by every call site in
         * between. A transient registration would hand each of them a different instance and
         * nothing would ever be captured; a singleton would carry one identity's entries into the
         * next request.
         */
        container.register(Debugger).inContainerScope();
        container.register(GraphQLDebuggerTransport);
        container.registerDecorator(DebuggerRouteDecorator);
    }
});
