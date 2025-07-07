import type { Component, GetPageOptions, IContentSdk, Page, ResolvedComponent } from "~/sdk/types";
import { environment } from "./Environment.js";
import { LiveSdk, type LiveSdkConfig } from "./LiveSdk.js";
import { EditingSdk } from "./EditingSdk.js";
import { ResolveElementParams } from "~/sdk/ComponentResolver";
import { PreviewSdk } from "./PreviewSdk.js";

export type ContentSDKConfig = LiveSdkConfig & {
    preview?: boolean;
};

class InternalContentSdk implements IContentSdk {
    private activeSdk: IContentSdk;
    private editingSdk: EditingSdk | undefined;

    constructor(liveSdk: LiveSdk, editingSdk?: EditingSdk) {
        this.activeSdk = editingSdk ?? liveSdk;
        this.editingSdk = editingSdk;
    }

    getEditingSdk() {
        return this.editingSdk;
    }

    async getPage(path: string, options?: GetPageOptions): Promise<Page | null> {
        return this.activeSdk.getPage(path, options);
    }

    listPages(): Promise<Page[]> {
        return this.activeSdk.listPages();
    }

    registerComponent(component: Component): void {
        this.activeSdk.registerComponent(component);
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        return this.activeSdk.resolveElement(params);
    }
}

export class ContentSdk implements IContentSdk {
    protected sdk?: InternalContentSdk;
    private isPreview = false;
    private lastConfig: any;

    public init(config: ContentSDKConfig, afterInit?: () => void): void {
        const configHash = JSON.stringify(config);
        if (this.lastConfig && this.lastConfig === configHash) {
            return;
        }

        this.lastConfig = configHash;

        let liveSdk: IContentSdk = new LiveSdk();
        (liveSdk as LiveSdk).init(config);

        if (config.preview && !environment.isEditing()) {
            this.isPreview = true;
            liveSdk = new PreviewSdk(liveSdk);
        }

        let editingSdk;
        if (environment.isEditing()) {
            editingSdk = new EditingSdk(liveSdk);
            editingSdk.init();
        }

        this.sdk = new InternalContentSdk(liveSdk as LiveSdk, editingSdk);

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

    public listPages() {
        this.assertInitialized();
        return this.sdk.listPages();
    }

    registerComponent(blueprint: Component): void {
        this.assertInitialized();
        this.sdk.registerComponent(blueprint);
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        this.assertInitialized();
        return this.sdk.resolveElement(params);
    }

    isEditing() {
        return environment.isEditing();
    }

    isPreviewing() {
        return this.isPreview;
    }

    private assertInitialized(): asserts this is this & { sdk: IContentSdk } {
        if (!this.sdk) {
            throw new Error(`ContentSdk has not been initialized!`);
        }
    }
}

export const contentSdk = new ContentSdk();
