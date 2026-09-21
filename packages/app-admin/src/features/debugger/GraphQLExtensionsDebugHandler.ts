import {
    GraphQLExtensionsEvent,
    GraphQLExtensionsEventHandler
} from "@webiny/app/features/graphqlClient/index.js";
import { debuggerStore, type IDebugPayload } from "./DebuggerStore.js";

/**
 * Collects debug data from responses that did not go through Apollo.
 *
 * Newer parts of Admin - Website Builder among them - use the fetch-based `GraphQLClient` rather
 * than Apollo, and that client returns only `data`. Without this the debugger would silently miss
 * everything they do, which looks identical to capture being broken.
 */
class GraphQLExtensionsDebugHandlerImpl implements GraphQLExtensionsEventHandler.Interface {
    async handle(event: GraphQLExtensionsEvent): Promise<void> {
        const debug = event.payload.extensions.debug as IDebugPayload | undefined;

        if (debug) {
            debuggerStore.collect(debug);
        }
    }
}

export const GraphQLExtensionsDebugHandler = GraphQLExtensionsEventHandler.createImplementation({
    implementation: GraphQLExtensionsDebugHandlerImpl,
    dependencies: []
});
