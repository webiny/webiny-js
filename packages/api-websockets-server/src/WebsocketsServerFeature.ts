import { createFeature } from "@webiny/feature/api";
import { ServerWebsocketsTransport } from "~/transport/ServerWebsocketsTransport.js";

/**
 * Per-request real-time transport for the self-hosted server: registers `ServerWebsocketsTransport`,
 * overriding the domain's NullWebsocketsTransport. Resolves the shared connection manager + adapter
 * from the root (registered there as singletons by the handler). Exposed as a Feature so the handler's
 * `transports` wiring reads uniformly (`WebsocketsServerFeature.register(c)`).
 */
export const WebsocketsServerFeature = createFeature({
    name: "WebsocketsServer",
    register(container) {
        container.register(ServerWebsocketsTransport);
    }
});
