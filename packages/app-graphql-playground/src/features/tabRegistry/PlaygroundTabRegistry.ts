import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { AuthenticationContext } from "@webiny/app-admin/features/security/AuthenticationContext/abstractions.js";
import { TenantContext } from "@webiny/app-admin/features/tenancy/abstractions.js";
import { PlaygroundClient } from "../playgroundClient/abstractions.js";
import { PlaygroundClientImpl } from "../playgroundClient/PlaygroundClient.js";
import { PlaygroundTabRegistry } from "./abstractions.js";
import { AuthenticatedPlaygroundClient } from "../playgroundClient/AuthenticatedPlaygroundClient.js";

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
    private readonly authenticationContext: AuthenticationContext.Interface;
    private readonly tenantContext: TenantContext.Interface;

    constructor(
        envConfig: EnvConfig.Interface,
        authenticationContext: AuthenticationContext.Interface,
        tenantContext: TenantContext.Interface
    ) {
        this.envConfig = envConfig;
        this.authenticationContext = authenticationContext;
        this.tenantContext = tenantContext;
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
        const getToken: PlaygroundClient.TokenGetter = async () => {
            const token = await this.authenticationContext.getIdToken();
            if (!token) {
                return null;
            }

            return token;
        };

        const client = new PlaygroundClientImpl(endpoint, getToken);

        return new AuthenticatedPlaygroundClient(client, this.tenantContext);
    }
}

export const DefaultPlaygroundTabRegistry = PlaygroundTabRegistry.createImplementation({
    implementation: PlaygroundTabRegistryImpl,
    dependencies: [EnvConfig, AuthenticationContext, TenantContext]
});
