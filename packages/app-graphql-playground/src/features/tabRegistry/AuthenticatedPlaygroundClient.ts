import { TenantContext } from "@webiny/app-admin/features/tenancy/abstractions.js";
import { PlaygroundClient } from "../playgroundClient/abstractions.js";

/*
 * Internal wrapper around a playground client that adds the `x-tenant` header
 * to every request, based on the currently selected tenant.
 */
export class AuthenticatedPlaygroundClient implements PlaygroundClient.Interface {
    private readonly client: PlaygroundClient.Interface;
    private readonly tenantContext: TenantContext.Interface;

    constructor(client: PlaygroundClient.Interface, tenantContext: TenantContext.Interface) {
        this.client = client;
        this.tenantContext = tenantContext;
    }

    public async execute(params: PlaygroundClient.Request): Promise<PlaygroundClient.Response> {
        const tenantHeaders: PlaygroundClient.Headers = {};

        const tenant = this.tenantContext.getCurrentTenant();
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
