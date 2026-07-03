import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { PlaygroundClientFactory } from "./factories.js";
import { AuthenticatedPlaygroundClientFactory } from "./factories.js";
import { DefaultPlaygroundClientFactory } from "./PlaygroundClientFactory.js";
import { DefaultAuthenticatedPlaygroundClientFactory } from "./AuthenticatedPlaygroundClientFactory.js";

export const PlaygroundClientFeature = createFeature({
    name: "PlaygroundClient",
    register(container) {
        container.register(DefaultPlaygroundClientFactory).inSingletonScope();
        container.register(DefaultAuthenticatedPlaygroundClientFactory).inSingletonScope();
    },
    resolve(container) {
        return {
            clientFactory: container.resolve(PlaygroundClientFactory),
            authenticatedClientFactory: container.resolve(AuthenticatedPlaygroundClientFactory)
        };
    }
});
