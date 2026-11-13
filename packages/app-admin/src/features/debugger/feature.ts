import { ApolloLinkPlugin } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { createFeature } from "@webiny/feature/admin";
import { createDebuggerLink } from "./debuggerLink.js";
import { debuggerStore } from "./DebuggerStore.js";
import { DebuggerPermissionsFeature } from "./permissions.js";
import { GraphQLExtensionsDebugHandler } from "./GraphQLExtensionsDebugHandler.js";

export const DebuggerFeature = createFeature({
    name: "Debugger",
    register(container) {
        DebuggerPermissionsFeature.register(container);

        /**
         * Collects from the fetch-based client, which Apollo links never see.
         */
        container.register(GraphQLExtensionsDebugHandler).inSingletonScope();

        /**
         * The link is always registered; whether it does anything is decided per request from the
         * toggle. Registering conditionally would mean the link never appears for a toggle flipped
         * after start-up.
         */
        plugins.register(new ApolloLinkPlugin(() => createDebuggerLink(debuggerStore)));
    }
});
