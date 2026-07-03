import { EnvConfig } from "@webiny/app/features/envConfig/abstractions.js";
import { PlaygroundTabRegistry } from "@webiny/app-graphql-playground/features/tabRegistry/index.js";
import { AuthenticatedPlaygroundClientFactory } from "@webiny/app-graphql-playground/features/playgroundClient/index.js";
import type { PlaygroundClient } from "@webiny/app-graphql-playground/features/playgroundClient/index.js";
import { manageQuery } from "./queries/placeholder.manage.graphql.js";
import { readQuery } from "./queries/placeholder.read.graphql.js";
import { previewQuery } from "./queries/placeholder.preview.graphql.js";

class CmsPlaygroundTabsDecorator implements PlaygroundTabRegistry.Interface {
    private readonly envConfig: EnvConfig.Interface;
    private readonly clientFactory: AuthenticatedPlaygroundClientFactory.Interface;
    private readonly decoratee: PlaygroundTabRegistry.Interface;

    constructor(
        envConfig: EnvConfig.Interface,
        clientFactory: AuthenticatedPlaygroundClientFactory.Interface,
        decoratee: PlaygroundTabRegistry.Interface
    ) {
        this.envConfig = envConfig;
        this.clientFactory = clientFactory;
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
        return this.clientFactory.createClient(endpoint);
    }
}

export const CmsPlaygroundTabs = PlaygroundTabRegistry.createDecorator({
    decorator: CmsPlaygroundTabsDecorator,
    dependencies: [EnvConfig, AuthenticatedPlaygroundClientFactory]
});
