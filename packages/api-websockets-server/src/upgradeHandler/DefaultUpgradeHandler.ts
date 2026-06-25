import type { IncomingMessage } from "node:http";
import { WebsocketsUpgradeHandler } from "~/abstractions.js";

export class DefaultUpgradeHandlerImpl implements WebsocketsUpgradeHandler.Interface {
    public async shouldUpgrade(
        _request: IncomingMessage
    ): Promise<WebsocketsUpgradeHandler.Decision> {
        return { allowed: true };
    }
}

export const DefaultUpgradeHandler = WebsocketsUpgradeHandler.createImplementation({
    implementation: DefaultUpgradeHandlerImpl,
    dependencies: []
});
