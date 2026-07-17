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
    previewParams?: string;
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
    private dataProvider?: IDataProvider;

    public init(config: ContentSDKConfig, afterInit?: () => void): void {
        const configHash = JSON.stringify(config);
        if (this.lastConfig && this.lastConfig === configHash) {
            return;
        }

        this.lastConfig = configHash;
        const apiClient = new ApiClient({
            apiHost: config.apiHost,
            apiKey: config.apiKey,
            apiTenant: config.apiTenant,
            preview: config.preview
        });

        const dataProvider = new DefaultDataProvider({ apiClient });
        this.dataProvider = dataProvider;

        let liveSdk: IContentSdk = new LiveSdk(dataProvider);

        if (config.preview && !environment.isEditing()) {
            this.isPreview = true;
            liveSdk = new PreviewSdk(dataProvider, liveSdk, config.previewParams);
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
        return getPageWithExperiment(
            {
                getPage: p => this.getPage(p),
                getPageExperiment: p => this.getPageExperiment(p),
                getVariantContent: id => this.getVariantContent(id),
                getExperimentPaused: id => this.getExperimentPaused(id)
            },
            path,
            options
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

    private requireDataProvider(): IDataProvider {
        if (!this.dataProvider) {
            throw new Error(`ContentSdk has not been initialized!`);
        }
        return this.dataProvider;
    }
}

export const contentSdk = new ContentSdk();
