import { PlaygroundClient } from "./abstractions.js";
import { PlaygroundClientFactory } from "./factories.js";
import { PlaygroundClientImpl } from "./PlaygroundClient.js";
import { AuthenticationContext } from "@webiny/app-admin/features/security/AuthenticationContext/abstractions.js";

class PlaygroundClientFactoryImpl implements PlaygroundClientFactory.Interface {
    private readonly authenticationContext: AuthenticationContext.Interface;

    constructor(authenticationContext: AuthenticationContext.Interface) {
        this.authenticationContext = authenticationContext;
    }

    public createClient(
        endpoint: string,
        options?: PlaygroundClientFactory.Options
    ): PlaygroundClient.Interface {
        const getToken: PlaygroundClient.TokenGetter =
            options?.getToken ||
            (async () => {
                const token = await this.authenticationContext.getIdToken();
                if (!token) {
                    return null;
                }

                return token;
            });

        return new PlaygroundClientImpl(endpoint, getToken);
    }
}

export const DefaultPlaygroundClientFactory = PlaygroundClientFactory.createImplementation({
    implementation: PlaygroundClientFactoryImpl,
    dependencies: [AuthenticationContext]
});
