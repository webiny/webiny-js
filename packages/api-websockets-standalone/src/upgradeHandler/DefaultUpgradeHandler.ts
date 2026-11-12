import type { IncomingMessage } from "node:http";
import { WebsocketsUpgradeHandler } from "./abstractions.js";
import { WEBSOCKETS_PATH } from "./constants.js";

/*
 * Accepts upgrades on `WEBSOCKETS_PATH` only. The server shares its HTTP server with the API, so
 * without this an upgrade on `/graphql` or any other path would open a socket too.
 */
export class DefaultUpgradeHandlerImpl implements WebsocketsUpgradeHandler.Interface {
    public async shouldUpgrade(
        request: IncomingMessage
    ): Promise<WebsocketsUpgradeHandler.Decision> {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (url.pathname !== WEBSOCKETS_PATH) {
            return { allowed: false, statusCode: 404, reason: "Not Found" };
        }
        return { allowed: true };
    }
}

export const DefaultUpgradeHandler = WebsocketsUpgradeHandler.createImplementation({
    implementation: DefaultUpgradeHandlerImpl,
    dependencies: []
});
