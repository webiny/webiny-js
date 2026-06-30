import type {
    CmsSdkConfig,
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    GetEntryParams,
    ListEntriesParams,
    IContentSdk
} from "./types.js";
import { LiveSdk } from "./LiveSdk.js";
import { EditingSdk } from "./EditingSdk.js";
import { environment } from "./Environment.js";
import { componentRegistry } from "./component/ComponentRegistry.js";
import type { Component } from "./component/types.js";

class ContentSdkImpl {
    private sdk: IContentSdk | null = null;

    init(config: CmsSdkConfig): void {
        if (environment.isEditing()) {
            this.sdk = new EditingSdk();
        } else {
            this.sdk = new LiveSdk(config);
        }
    }

    registerComponent(component: Component): void {
        componentRegistry.register(component);
    }

    async getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        return this.getSdk().getEntry<T>(params);
    }

    async listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<CmsListResult<T>> {
        return this.getSdk().listEntries<T>(params);
    }

    isEditing(): boolean {
        return environment.isEditing();
    }

    isServer(): boolean {
        return environment.isServer();
    }

    isClient(): boolean {
        return environment.isClient();
    }

    private getSdk(): IContentSdk {
        if (!this.sdk) {
            throw new Error(
                "CMS SDK is not initialized. Call contentSdk.init() before using the SDK."
            );
        }
        return this.sdk;
    }
}

export const contentSdk = new ContentSdkImpl();
