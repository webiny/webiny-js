import type {
    Component,
    IContentSdk,
    IDataProvider,
    ListPagesOptions,
    ListPagesResult,
    PublicPage,
    PublicRedirect,
    ResolvedComponent
} from "~/types.js";
import type { ActiveExperiment, VariantContent } from "~/experiments/types.js";
import {
    getPageWithExperiment,
    type ExperimentRenderResult,
    type GetPageWithExperimentOptions
} from "~/experiments/render.js";
import { environment } from "./Environment.js";
import { LiveSdk } from "./LiveSdk.js";
import { EditingSdk } from "./EditingSdk.js";
import { ComponentResolver, type ResolveElementParams } from "~/ComponentResolver.js";
import { PreviewSdk } from "./PreviewSdk.js";
import type { ComponentRegistry } from "~/ComponentRegistry.js";
import { componentRegistry } from "~/ComponentRegistry.js";
import type { ContentEntryCache } from "~/contentEntry/ContentEntryCache.js";
import { contentEntryCache } from "~/contentEntry/ContentEntryCache.js";
import type { DocumentStoreManager } from "~/DocumentStoreManager.js";
import { documentStoreManager } from "~/DocumentStoreManager.js";
import { ApiClient } from "~/dataProviders/ApiClient.js";
import { DefaultDataProvider } from "~/dataProviders/DefaultDataProvider.js";
import type { WebsiteBuilderThemeInput } from "./types/WebsiteBuilderTheme.js";
import { Theme } from "./Theme.js";
import { viewportManager } from "./ViewportManager.js";
import type { IRedirects } from "~/IRedirects.js";
import { RedirectsProvider } from "~/dataProviders/RedirectsProvider.js";
import type { HeadersProvider } from "~/headersProvider.js";

export type ApiConfig = {
    apiKey: string;
    apiHost: string;
    apiTenant: string;
};

export type ContentSDKConfig = ApiConfig & {
    preview?: boolean;
    previewParams?: string;
    theme?: WebsiteBuilderThemeInput;
    /**
     * Request headers for server-side preview and experiments. When omitted, the provider set
     * with `setHeadersProvider` is used. Meant for apps that serve requests outside the
     * framework hook; it never carries the tenant.
     */
    headersProvider?: HeadersProvider;
};

/**
 * The state a `ContentSdk` renders with. Each piece defaults to its module-level singleton, so
 * `new ContentSdk()` shares state with `contentSdk`. `createContentClient` passes new instances.
 */
export type ContentSdkState = {
    componentRegistry?: ComponentRegistry;
    contentEntryCache?: ContentEntryCache;
    documentStoreManager?: DocumentStoreManager;
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
    private dataProvider?: IDataProvider;
    private headersProvider?: HeadersProvider;
    private readonly componentRegistry: ComponentRegistry;
    private readonly contentEntryCache: ContentEntryCache;
    private readonly documentStoreManager: DocumentStoreManager;

    constructor(state: ContentSdkState = {}) {
        this.componentRegistry = state.componentRegistry ?? componentRegistry;
        this.contentEntryCache = state.contentEntryCache ?? contentEntryCache;
        this.documentStoreManager = state.documentStoreManager ?? documentStoreManager;
    }

    public init(config: ContentSDKConfig, afterInit?: () => void): void {
        const configHash = JSON.stringify(config);
        if (this.lastConfig && this.lastConfig === configHash) {
            return;
        }

        this.lastConfig = configHash;
        this.headersProvider = config.headersProvider;
        const apiClient = new ApiClient({
            apiHost: config.apiHost,
            apiKey: config.apiKey,
            apiTenant: config.apiTenant,
            preview: config.preview
        });

        const dataProvider = new DefaultDataProvider({ apiClient });
        this.dataProvider = dataProvider;

        let liveSdk: IContentSdk = new LiveSdk(dataProvider, this.documentStoreManager);

        if (config.preview && !environment.isEditing()) {
            this.isPreview = true;
            liveSdk = new PreviewSdk(
                dataProvider,
                liveSdk,
                config.previewParams,
                config.headersProvider
            );
        }

        const theme = Theme.from(config.theme ?? {});

        if (environment.isClient()) {
            viewportManager.setBreakpoints(theme.breakpoints);
        }

        let editingSdk;
        if (environment.isEditing()) {
            editingSdk = new EditingSdk(liveSdk, theme, {
                componentRegistry: this.componentRegistry,
                documentStoreManager: this.documentStoreManager
            });
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

    public getPageExperiment(path: string): Promise<ActiveExperiment | null> {
        return this.requireDataProvider().getPageExperiment(path);
    }

    public getVariantContent(variantId: string): Promise<VariantContent | null> {
        return this.requireDataProvider().getVariantContent(variantId);
    }

    public getExperimentPaused(experimentId: string): Promise<boolean> {
        return this.requireDataProvider().getExperimentPaused(experimentId);
    }

    /**
     * Resolve and render the right page for the current visitor (control or a variant),
     * server-side. Bucketing, targeting, exposure emission, and cache-key handling are all
     * encapsulated here so projects do not reimplement them. See {@link getPageWithExperiment}.
     */
    public getPageWithExperiment(
        path: string,
        options?: GetPageWithExperimentOptions
    ): Promise<ExperimentRenderResult> {
        this.assertInitialized();
        this.requireDataProvider();
        const experimentOptions: GetPageWithExperimentOptions = { ...options };
        if (this.headersProvider && !experimentOptions.headersProvider) {
            experimentOptions.headersProvider = this.headersProvider;
        }
        return getPageWithExperiment(
            {
                getPage: p => this.getPage(p),
                getPageExperiment: p => this.getPageExperiment(p),
                getVariantContent: id => this.getVariantContent(id),
                getExperimentPaused: id => this.getExperimentPaused(id)
            },
            path,
            experimentOptions
        );
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
        this.componentRegistry.register(blueprint);
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        this.assertInitialized();
        return new ComponentResolver(this.componentRegistry, this.contentEntryCache).resolve(
            params
        );
    }

    public getComponentRegistry(): ComponentRegistry {
        return this.componentRegistry;
    }

    public getContentEntryCache(): ContentEntryCache {
        return this.contentEntryCache;
    }

    public getDocumentStoreManager(): DocumentStoreManager {
        return this.documentStoreManager;
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

    private requireDataProvider(): IDataProvider {
        if (!this.dataProvider) {
            throw new Error(`ContentSdk has not been initialized!`);
        }
        return this.dataProvider;
    }
}

export const contentSdk = new ContentSdk();
