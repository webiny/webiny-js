import { contentSdk as cmsContentSdk, environment as cmsEnvironment } from "@webiny/cms-sdk";
import type {
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    CmsModelDefinition,
    GetEntryParams,
    ListEntriesParams
} from "@webiny/cms-sdk";
import { contentSdk as wbContentSdk, registerComponentGroup } from "@webiny/website-builder-sdk";
import type {
    PublicPage,
    PublicRedirect,
    ListPagesOptions,
    ListPagesResult,
    Component as WbComponent,
    ComponentGroup
} from "@webiny/website-builder-sdk";
import type { ContentSdkConfig } from "./types.js";

class CmsContentSdkFacade {
    getModel(modelId: string): Promise<CmsModelDefinition | null> {
        return cmsContentSdk.getModel(modelId);
    }

    getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        return cmsContentSdk.getEntry<T>(params);
    }

    listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<CmsListResult<T>> {
        return cmsContentSdk.listEntries<T>(params);
    }
}

class WbContentSdkFacade {
    getPage(path: string): Promise<PublicPage | null> {
        return wbContentSdk.getPage(path);
    }

    listPages(options?: ListPagesOptions): Promise<ListPagesResult> {
        return wbContentSdk.listPages(options);
    }

    getAllRedirects(): Promise<Map<string, PublicRedirect>> {
        return wbContentSdk.getAllRedirects();
    }

    getRedirectByPath(path: string): Promise<PublicRedirect | undefined> {
        return wbContentSdk.getRedirectByPath(path);
    }

    registerComponent(blueprint: WbComponent): void {
        wbContentSdk.registerComponent(blueprint);
    }

    registerComponentGroup(group: ComponentGroup): void {
        registerComponentGroup(group);
    }

    isPreviewing(): boolean {
        return wbContentSdk.isPreviewing();
    }
}

export class ContentSdk {
    readonly cms = new CmsContentSdkFacade();
    readonly wb = new WbContentSdkFacade();

    init(config: ContentSdkConfig): void {
        cmsContentSdk.init({
            apiHost: config.apiHost,
            apiKey: config.apiKey,
            apiTenant: config.apiTenant,
            preview: config.preview,
            fetch: config.fetch
        });

        wbContentSdk.init({
            apiHost: config.apiHost,
            apiKey: config.apiKey,
            apiTenant: config.apiTenant ?? "root",
            preview: config.preview,
            theme: config.wb?.theme,
            previewParams: config.wb?.previewParams
        });

        if (config.wb?.componentGroups) {
            for (const group of config.wb.componentGroups) {
                this.wb.registerComponentGroup(group);
            }
        }
    }

    isEditing(): boolean {
        return cmsEnvironment.isEditing();
    }

    isServer(): boolean {
        return cmsEnvironment.isServer();
    }

    isClient(): boolean {
        return cmsEnvironment.isClient();
    }
}

export const contentSdk = new ContentSdk();
