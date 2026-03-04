import type {
    Component,
    IContentSdk,
    ListPagesOptions,
    ListPagesResult,
    PublicPage,
    PublicRedirect,
    ResolvedComponent
} from "~/types.js";
import { environment } from "./Environment.js";
import { LiveSdk } from "./LiveSdk.js";
import { EditingSdk } from "./EditingSdk.js";
import { ComponentResolver, type ResolveElementParams } from "~/ComponentResolver.js";
import { PreviewSdk } from "./PreviewSdk.js";
import { componentRegistry } from "~/ComponentRegistry.js";
import { ApiClient } from "~/dataProviders/ApiClient.js";
import { DefaultDataProvider } from "~/dataProviders/DefaultDataProvider.js";
import type { WebsiteBuilderThemeInput } from "./types/WebsiteBuilderTheme.js";
import { Theme } from "./Theme.js";
import { viewportManager } from "./ViewportManager.js";
import type { IRedirects } from "~/IRedirects.js";
import { RedirectsProvider } from "~/dataProviders/RedirectsProvider.js";

export type ApiConfig = {
    apiKey: string;
    apiHost: string;
    apiTenant: string;
};

export type ContentSDKConfig = ApiConfig & {
    preview?: boolean;
    theme?: WebsiteBuilderThemeInput;
};

class InternalContentSdk implements IContentSdk, IRedirects {
    private activeSdk: IContentSdk;
    private editingSdk: EditingSdk | undefined;
    private redirectsProvider: IRedirects;

    constructor(redirectsProvider: IRedirects, liveSdk: LiveSdk, editingSdk?: EditingSdk) {
        this.redirectsProvider = redirectsProvider;
        this.activeSdk = editingSdk ?? liveSdk;
        this.editingSdk = editingSdk;
    }

    getEditingSdk() {
        return this.editingSdk;
    }

    async getPage(path: string): Promise<PublicPage | null> {
        return this.activeSdk.getPage(path);
    }

    listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        return this.activeSdk.listPages(options);
    }

    getAllRedirects(): Promise<Map<string, PublicRedirect>> {
        return this.redirectsProvider.getAllRedirects();
    }

    getRedirectByPath(path: string): Promise<PublicRedirect | undefined> {
        return this.redirectsProvider.getRedirectByPath(path);
    }
}

export class ContentSdk implements IContentSdk, IRedirects {
    protected sdk?: InternalContentSdk;
    private isPreview = false;
    private lastConfig: any;

    public init(config: ContentSDKConfig, afterInit?: () => void): void {
        const configHash = JSON.stringify(config);
        if (this.lastConfig && this.lastConfig === configHash) {
            return;
        }

        this.lastConfig = configHash;
        const apiClient = new ApiClient(config.apiHost, config.apiKey, config.apiTenant);

        const dataProvider = new DefaultDataProvider({ apiClient });

        let liveSdk: IContentSdk = new LiveSdk(dataProvider);

        if (config.preview && !environment.isEditing()) {
            this.isPreview = true;
            liveSdk = new PreviewSdk(dataProvider, liveSdk);
        }

        const theme = Theme.from(config.theme ?? {});

        if (environment.isClient()) {
            viewportManager.setBreakpoints(theme.breakpoints);
        }

        let editingSdk;
        if (environment.isEditing()) {
            editingSdk = new EditingSdk(liveSdk, theme);
        }

        this.sdk = new InternalContentSdk(
            new RedirectsProvider(apiClient),
            liveSdk as LiveSdk,
            editingSdk
        );

        if (typeof afterInit === "function") {
            afterInit();
        }
    }

    public getEditingSdk() {
        this.assertInitialized();
        return this.sdk.getEditingSdk();
    }

    public getPage(path: string) {
        this.assertInitialized();
        return this.sdk.getPage(path);
    }

    public listPages(options?: ListPagesOptions) {
        this.assertInitialized();
        return this.sdk.listPages(options);
    }

    public async getAllRedirects() {
        this.assertInitialized();
        return this.sdk.getAllRedirects();
    }

    getRedirectByPath(path: string): Promise<PublicRedirect | undefined> {
        this.assertInitialized();
        return this.sdk.getRedirectByPath(path);
    }

    registerComponent(blueprint: Component): void {
        this.assertInitialized();
        componentRegistry.register(blueprint);
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        this.assertInitialized();
        return new ComponentResolver(componentRegistry).resolve(params);
    }

    isEditing() {
        return environment.isEditing();
    }

    isPreviewing() {
        return this.isPreview;
    }

    private assertInitialized(): asserts this is this & {
        sdk: IContentSdk;
    } {
        if (!this.sdk) {
            throw new Error(`ContentSdk has not been initialized!`);
        }
    }
}

export const contentSdk = new ContentSdk();
