import { createFeature } from "@webiny/feature/api";
import { InMemoryLiveSockets } from "~/liveSockets/InMemoryLiveSockets.js";
import { ServerConnectionManager } from "~/connectionManager/ServerConnectionManager.js";
import { NodeWsAdapter } from "~/adapter/NodeWsAdapter.js";
import { WebsocketsConnectionRowsInputType } from "~/rows/WebsocketsConnectionRowsInputType.js";
import { WriteConnectionRowsHandler } from "~/rows/WriteConnectionRowsHandler.js";

/**
 * The server's websocket machinery, in the root container: the live sockets (in memory), the
 * connection manager the upgrade acceptor and the heartbeat use, and the adapter, as singletons
 * shared with every request's `ServerWebsocketsTransport`. None of it holds a storage: the
 * connections' rows change through `WebsocketsConnectionRowsEvent`, whose handler runs in a request
 * container, on that request's registry. Needs an `InputDispatcher` in the root.
 */
export const WebsocketsServerRootFeature = createFeature({
    name: "WebsocketsServerRoot",
    register(container) {
        container.register(InMemoryLiveSockets).inSingletonScope();
        container.register(ServerConnectionManager).inSingletonScope();
        container.register(NodeWsAdapter).inSingletonScope();
        container.register(WebsocketsConnectionRowsInputType);
        container.register(WriteConnectionRowsHandler);
    }
});
