import { GraphQLExtensionsEventHandler } from "@webiny/app/features/graphqlClient/index.js";
import { DebugSessionsRepository } from "./abstractions.js";

/**
 * Collects the debug data the API attaches to GraphQL responses.
 *
 * Only while capture is on: turning it off in the panel means nothing more is held in memory, even
 * though the API keeps attaching data for as long as the identity holds the permission.
 */
class GraphQLExtensionsDebugHandlerImpl implements GraphQLExtensionsEventHandler.Interface {
    constructor(private repository: DebugSessionsRepository.Interface) {}

    async handle(event: GraphQLExtensionsEventHandler.Event): Promise<void> {
        const debug: DebugSessionsRepository.Payload | undefined = event.payload.extensions.debug;
        if (!debug || !this.repository.isCaptureOn()) {
            return;
        }

        this.repository.collect(debug);
    }
}

export const GraphQLExtensionsDebugHandler = GraphQLExtensionsEventHandler.createImplementation({
    implementation: GraphQLExtensionsDebugHandlerImpl,
    dependencies: [DebugSessionsRepository]
});
