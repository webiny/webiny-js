import type {
    CmsSdkConfig,
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    CmsModelDefinition,
    GetEntryParams,
    ListEntriesParams,
    IContentSdk
} from "./types.js";
import { LiveSdk } from "./LiveSdk.js";
import { EditingSdk } from "./EditingSdk.js";
import { environment } from "./Environment.js";
import { componentRegistry } from "./component/ComponentRegistry.js";
import type { Component } from "./component/types.js";

class InternalContentSdk implements IContentSdk {
    private activeSdk: IContentSdk;
    private editingSdk: EditingSdk | undefined;

    constructor(liveSdk: IContentSdk, editingSdk?: EditingSdk) {
        this.activeSdk = editingSdk ?? liveSdk;
        this.editingSdk = editingSdk;
    }

    getEditingSdk() {
        return this.editingSdk;
    }

    getModel(modelId: string): Promise<CmsModelDefinition | null> {
        return this.activeSdk.getModel(modelId);
    }

    getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        return this.activeSdk.getEntry<T>(params);
    }

    listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<CmsListResult<T>> {
        return this.activeSdk.listEntries<T>(params);
    }
}

export class ContentSdk implements IContentSdk {
    protected sdk?: InternalContentSdk;

    init(config: CmsSdkConfig): void {
        const liveSdk = new LiveSdk(config);

        let editingSdk: EditingSdk | undefined;
        if (environment.isEditing()) {
            editingSdk = new EditingSdk(liveSdk);
        }

        this.sdk = new InternalContentSdk(liveSdk, editingSdk);
    }

    getEditingSdk() {
        this.assertInitialized();
        return this.sdk.getEditingSdk();
    }

    getModel(modelId: string) {
        this.assertInitialized();
        return this.sdk.getModel(modelId);
    }

    getEntry<T extends CmsEntryValues = CmsEntryValues>(params: GetEntryParams) {
        this.assertInitialized();
        return this.sdk.getEntry<T>(params);
    }

    listEntries<T extends CmsEntryValues = CmsEntryValues>(params: ListEntriesParams) {
        this.assertInitialized();
        return this.sdk.listEntries<T>(params);
    }

    registerComponent(component: Component): void {
        this.assertInitialized();
        componentRegistry.register(component);
    }

    isEditing() {
        return environment.isEditing();
    }

    isServer() {
        return environment.isServer();
    }

    isClient() {
        return environment.isClient();
    }

    private assertInitialized(): asserts this is this & { sdk: InternalContentSdk } {
        if (!this.sdk) {
            throw new Error("CMS SDK is not initialized. Call contentSdk.init() before using.");
        }
    }
}

export const contentSdk = new ContentSdk();
