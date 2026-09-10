import { PlaygroundClient as PlaygroundClientAbstraction } from "./abstractions/PlaygroundClient.js";
import { PlaygroundClientFactory } from "./abstractions/PlaygroundClientFactory.js";
import { PlaygroundClient } from "./PlaygroundClient.js";
import { AuthenticationContext } from "@webiny/app-admin/features/security/AuthenticationContext/abstractions.js";

class PlaygroundClientFactoryImpl implements PlaygroundClientFactory.Interface {
    private readonly authenticationContext: AuthenticationContext.Interface;

    constructor(authenticationContext: AuthenticationContext.Interface) {
        this.authenticationContext = authenticationContext;
    }

    public createClient(
        endpoint: string,
        options?: PlaygroundClientFactory.Options
    ): PlaygroundClientAbstraction.Interface {
        if (options?.getToken) {
            return PlaygroundClient.create(endpoint, options.getToken);
        }

        return PlaygroundClient.create(endpoint, async () => {
            const token = await this.authenticationContext.getIdToken();
            if (!token) {
                return null;
            }

            return token;
        });
    }
}

export const DefaultPlaygroundClientFactory = PlaygroundClientFactory.createImplementation({
    implementation: PlaygroundClientFactoryImpl,
    dependencies: [AuthenticationContext]
});
