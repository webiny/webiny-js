import { componentRegistry } from "~/sdk/ComponentRegistry.js";
import { ComponentResolver, ResolveElementParams } from "~/sdk/ComponentResolver.js";
import {
    Component,
    GetPageOptions,
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    Page,
    ResolvedComponent
} from "~/sdk/types.js";
import { NullDataProvider } from "./dataProviders/NullDataProvider.js";
import { DefaultDataProvider } from "./dataProviders/DefaultDataProvider.js";
import { documentStoreManager } from "~/sdk/DocumentStoreManager";

export type LiveSdkConfig = {
    apiKey: string;
    apiEndpoint?: string;
};

export class LiveSdk implements IContentSdk {
    private initialized = false;
    private apiKey = "";
    private apiEndpoint = "/api/pages";
    private dataProvider: IDataProvider = new NullDataProvider();

    public init(config: LiveSdkConfig) {
        if (this.initialized) {
            return;
        }

        this.apiKey = config.apiKey;
        this.apiEndpoint = config.apiEndpoint || "/api/pages";

        this.dataProvider = new DefaultDataProvider({
            apiKey: this.apiKey,
            apiEndpoint: this.apiEndpoint
        });

        this.initialized = true;
    }

    async getPage(path: string, options?: GetPageOptions): Promise<Page | null> {
        const page = await this.dataProvider.getPage(path, options);
        if (page) {
            documentStoreManager.getStore(page.properties.id).setDocument(page);
        }
        return page;
    }

    listPages(options?: ListPagesOptions): Promise<Page[]> {
        return this.dataProvider.listPages(options);
    }

    registerComponent(blueprint: Component): void {
        componentRegistry.register(blueprint);
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        return new ComponentResolver(componentRegistry).resolve(params);
    }
}
