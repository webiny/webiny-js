import { Webiny, Result } from "@webiny/sdk";
import type {
    LanguagesSdk,
    FileManagerSdk,
    TenantManagerSdk,
    TasksSdk,
    WebhooksSdk,
    CmsEntryValues as SdkCmsEntryValues,
    CreateEntryParams,
    UpdateEntryRevisionParams,
    DeleteEntryRevisionParams,
    PublishEntryRevisionParams,
    UnpublishEntryRevisionParams
} from "@webiny/sdk";
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

class CmsSdk {
    constructor(private webiny: Webiny) {}

    getModel(modelId: string): Promise<Result<CmsModelDefinition, Error>> {
        return cmsContentSdk.getModel(modelId).then(model => {
            return model
                ? Result.ok(model)
                : Result.fail(new Error(`Model "${modelId}" not found.`));
        });
    }

    getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<Result<CmsEntry<T>, Error>> {
        return cmsContentSdk.getEntry<T>(params).then(entry => {
            return entry
                ? Result.ok(entry)
                : Result.fail(
                      new Error(`Entry "${params.entryId}" not found in model "${params.modelId}".`)
                  );
        });
    }

    listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<Result<CmsListResult<T>, Error>> {
        return cmsContentSdk.listEntries<T>(params).then(result => Result.ok(result));
    }

    createEntry<T extends SdkCmsEntryValues = SdkCmsEntryValues>(params: CreateEntryParams<T>) {
        return this.webiny.cms.createEntry<T>(params);
    }

    updateEntryRevision<T extends SdkCmsEntryValues = SdkCmsEntryValues>(
        params: UpdateEntryRevisionParams<T>
    ) {
        return this.webiny.cms.updateEntryRevision<T>(params);
    }

    deleteEntryRevision(params: DeleteEntryRevisionParams) {
        return this.webiny.cms.deleteEntryRevision(params);
    }

    publishEntryRevision<T extends SdkCmsEntryValues = SdkCmsEntryValues>(
        params: PublishEntryRevisionParams
    ) {
        return this.webiny.cms.publishEntryRevision<T>(params);
    }

    unpublishEntryRevision<T extends SdkCmsEntryValues = SdkCmsEntryValues>(
        params: UnpublishEntryRevisionParams
    ) {
        return this.webiny.cms.unpublishEntryRevision<T>(params);
    }
}

class WbSdk {
    getPage(path: string): Promise<Result<PublicPage, Error>> {
        return wbContentSdk.getPage(path).then(page => {
            return page ? Result.ok(page) : Result.fail(new Error(`Page "${path}" not found.`));
        });
    }

    listPages(options?: ListPagesOptions): Promise<Result<ListPagesResult, Error>> {
        return wbContentSdk.listPages(options).then(result => Result.ok(result));
    }

    getAllRedirects(): Promise<Result<Map<string, PublicRedirect>, Error>> {
        return wbContentSdk.getAllRedirects().then(redirects => Result.ok(redirects));
    }

    getRedirectByPath(path: string): Promise<Result<PublicRedirect | undefined, Error>> {
        return wbContentSdk.getRedirectByPath(path).then(redirect => Result.ok(redirect));
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

interface InitializedSdk {
    webiny: Webiny;
    cms: CmsSdk;
    wb: WbSdk;
}

export class ContentSdk {
    private sdk?: InitializedSdk;

    private get initialized(): InitializedSdk {
        if (!this.sdk) {
            throw new Error("SDK is not initialized. Call contentSdk.init() first.");
        }
        return this.sdk;
    }

    get cms(): CmsSdk {
        return this.initialized.cms;
    }

    get wb(): WbSdk {
        return this.initialized.wb;
    }

    get languages(): LanguagesSdk {
        return this.initialized.webiny.languages;
    }

    get fileManager(): FileManagerSdk {
        return this.initialized.webiny.fileManager;
    }

    get tenantManager(): TenantManagerSdk {
        return this.initialized.webiny.tenantManager;
    }

    get tasks(): TasksSdk {
        return this.initialized.webiny.tasks;
    }

    get webhooks(): WebhooksSdk {
        return this.initialized.webiny.webhooks;
    }

    init(config: ContentSdkConfig): void {
        const webiny = new Webiny({
            endpoint: config.endpoint,
            token: config.token,
            tenant: config.tenant || "root",
            fetch: config.fetch
        });

        this.sdk = {
            webiny,
            cms: new CmsSdk(webiny),
            wb: new WbSdk()
        };

        cmsContentSdk.init(
            {
                apiHost: config.endpoint,
                apiKey: config.token,
                apiTenant: config.tenant,
                preview: config.preview,
                fetch: config.fetch
            },
            webiny
        );

        wbContentSdk.init({
            apiHost: config.endpoint,
            apiKey: config.token,
            apiTenant: config.tenant ?? "root",
            preview: config.preview,
            theme: config.wb?.theme,
            previewParams: config.wb?.previewParams
        });

        if (config.wb?.componentGroups) {
            for (const group of config.wb.componentGroups) {
                this.sdk.wb.registerComponentGroup(group);
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
