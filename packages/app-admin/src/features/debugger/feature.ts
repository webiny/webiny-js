import { ApolloLinkPlugin } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { createFeature } from "@webiny/feature/admin";
import { createDebuggerLink } from "./debuggerLink.js";
import { debuggerStore } from "./DebuggerStore.js";

export const DebuggerFeature = createFeature({
    name: "Debugger",
    register() {
        /**
         * The link is always registered; whether it does anything is decided per request from the
         * toggle. Registering conditionally would mean the link never appears for a toggle flipped
         * after start-up.
         */
        plugins.register(new ApolloLinkPlugin(() => createDebuggerLink(debuggerStore)));
    }
});
