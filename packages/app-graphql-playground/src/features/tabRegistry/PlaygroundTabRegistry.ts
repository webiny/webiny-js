import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import type { PlaygroundClient } from "../playgroundClient/abstractions.js";
import { AuthenticatedPlaygroundClientFactory } from "../playgroundClient/factories.js";
import { PlaygroundTabRegistry } from "./abstractions.js";

const DEFAULT_QUERY = `# Webiny Main API
#
# Press Ctrl+Enter (Cmd+Enter on Mac) to execute.
{
  adminUsers {
    listUsers {
      data {
        email
        firstName
        createdOn
      }
    }
  }
}
`;

class PlaygroundTabRegistryImpl implements PlaygroundTabRegistry.Interface {
    private readonly envConfig: EnvConfig.Interface;
    private readonly clientFactory: AuthenticatedPlaygroundClientFactory.Interface;

    constructor(
        envConfig: EnvConfig.Interface,
        clientFactory: AuthenticatedPlaygroundClientFactory.Interface
    ) {
        this.envConfig = envConfig;
        this.clientFactory = clientFactory;
    }

    public getTabs(): PlaygroundTabRegistry.TabDefinition[] {
        const endpoint = this.envConfig.get("graphqlApiUrl");

        return [
            {
                id: "main-api",
                name: "Main API",
                endpoint,
                client: this.createClient(endpoint),
                defaultQuery: DEFAULT_QUERY
            }
        ];
    }

    private createClient(endpoint: string): PlaygroundClient.Interface {
        return this.clientFactory.createClient(endpoint);
    }
}

export const DefaultPlaygroundTabRegistry = PlaygroundTabRegistry.createImplementation({
    implementation: PlaygroundTabRegistryImpl,
    dependencies: [EnvConfig, AuthenticatedPlaygroundClientFactory]
});
