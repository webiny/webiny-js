import { PlaygroundClient } from "./abstractions/PlaygroundClient.js";

interface TenantGetter {
    (): string | null;
}

/*
 * Internal wrapper around a playground client that adds the `x-tenant` header
 * to every request, based on the currently selected tenant.
 */
export class AuthenticatedPlaygroundClient implements PlaygroundClient.Interface {
    private readonly client: PlaygroundClient.Interface;
    private readonly getTenant: TenantGetter;

    private constructor(client: PlaygroundClient.Interface, getTenant: TenantGetter) {
        this.client = client;
        this.getTenant = getTenant;
    }

    public static create(client: PlaygroundClient.Interface, getTenant: TenantGetter) {
        return new AuthenticatedPlaygroundClient(client, getTenant);
    }

    public async execute(params: PlaygroundClient.Request): Promise<PlaygroundClient.Response> {
        const tenantHeaders: PlaygroundClient.Headers = {};

        const tenant = this.getTenant();
        if (tenant) {
            tenantHeaders["x-tenant"] = tenant;
        }

        const userHeaders = params.headers || {};

        const result = await this.client.execute({
            ...params,
            headers: {
                ...tenantHeaders,
                ...userHeaders
            }
        });

        return result;
    }
}
