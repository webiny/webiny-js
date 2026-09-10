import { TenantContext } from "@webiny/app-admin/features/tenancy/abstractions.js";
import { AuthenticatedPlaygroundClientFactory } from "./abstractions/AuthenticatedPlaygroundClientFactory.js";
import { PlaygroundClientFactory } from "./abstractions/PlaygroundClientFactory.js";
import { AuthenticatedPlaygroundClient } from "./AuthenticatedPlaygroundClient.js";

class AuthenticatedPlaygroundClientFactoryImpl
    implements AuthenticatedPlaygroundClientFactory.Interface
{
    private readonly clientFactory: PlaygroundClientFactory.Interface;
    private readonly tenantContext: TenantContext.Interface;

    constructor(
        clientFactory: PlaygroundClientFactory.Interface,
        tenantContext: TenantContext.Interface
    ) {
        this.clientFactory = clientFactory;
        this.tenantContext = tenantContext;
    }

    public createClient(
        endpoint: string,
        options?: AuthenticatedPlaygroundClientFactory.Options
    ): AuthenticatedPlaygroundClientFactory.Client {
        const client = this.clientFactory.createClient(endpoint, {
            getToken: options?.getToken
        });

        const getTenant = options?.getTenant || (() => this.tenantContext.getCurrentTenant());

        return AuthenticatedPlaygroundClient.create(client, getTenant);
    }
}

export const DefaultAuthenticatedPlaygroundClientFactory =
    AuthenticatedPlaygroundClientFactory.createImplementation({
        implementation: AuthenticatedPlaygroundClientFactoryImpl,
        dependencies: [PlaygroundClientFactory, TenantContext]
    });
