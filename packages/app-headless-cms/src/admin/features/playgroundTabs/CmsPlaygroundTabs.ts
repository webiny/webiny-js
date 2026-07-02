import { EnvConfig } from "@webiny/app/features/envConfig/abstractions.js";
import { AuthenticationContext } from "@webiny/app-admin/features/security/AuthenticationContext/abstractions.js";
import { TenantContext } from "@webiny/app-admin/features/tenancy/abstractions.js";
import { PlaygroundTabRegistry } from "@webiny/app-graphql-playground/features/tabRegistry/abstractions.js";
import { PlaygroundClientImpl } from "@webiny/app-graphql-playground/features/playgroundClient/index.js";
import { AuthenticatedPlaygroundClient } from "@webiny/app-graphql-playground/features/tabRegistry/index.js";
import type { PlaygroundClient } from "@webiny/app-graphql-playground/features/playgroundClient/abstractions.js";
import { manageQuery } from "./queries/placeholder.manage.graphql.js";
import { readQuery } from "./queries/placeholder.read.graphql.js";
import { previewQuery } from "./queries/placeholder.preview.graphql.js";

class CmsPlaygroundTabsDecorator implements PlaygroundTabRegistry.Interface {
    private readonly envConfig: EnvConfig.Interface;
    private readonly authenticationContext: AuthenticationContext.Interface;
    private readonly tenantContext: TenantContext.Interface;
    private readonly decoratee: PlaygroundTabRegistry.Interface;

    constructor(
        envConfig: EnvConfig.Interface,
        authenticationContext: AuthenticationContext.Interface,
        tenantContext: TenantContext.Interface,
        decoratee: PlaygroundTabRegistry.Interface
    ) {
        this.envConfig = envConfig;
        this.authenticationContext = authenticationContext;
        this.tenantContext = tenantContext;
        this.decoratee = decoratee;
    }

    public getTabs(): PlaygroundTabRegistry.TabDefinition[] {
        const baseTabs = this.decoratee.getTabs();
        const apiUrl = this.envConfig.get("apiUrl");

        const cmsTabs: PlaygroundTabRegistry.TabDefinition[] = [
            {
                id: "cms-manage",
                name: "Headless CMS - Manage API",
                endpoint: `${apiUrl}/cms/manage`,
                client: this.createClient(`${apiUrl}/cms/manage`),
                defaultQuery: manageQuery
            },
            {
                id: "cms-read",
                name: "Headless CMS - Read API",
                endpoint: `${apiUrl}/cms/read`,
                client: this.createClient(`${apiUrl}/cms/read`),
                defaultQuery: readQuery
            },
            {
                id: "cms-preview",
                name: "Headless CMS - Preview API",
                endpoint: `${apiUrl}/cms/preview`,
                client: this.createClient(`${apiUrl}/cms/preview`),
                defaultQuery: previewQuery
            }
        ];

        return [...baseTabs, ...cmsTabs];
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

export const CmsPlaygroundTabs = PlaygroundTabRegistry.createDecorator({
    decorator: CmsPlaygroundTabsDecorator,
    dependencies: [EnvConfig, AuthenticationContext, TenantContext]
});
