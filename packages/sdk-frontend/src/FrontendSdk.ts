import { Webiny } from "@webiny/sdk";
import type {
    LanguagesSdk,
    FileManagerSdk,
    TenantManagerSdk,
    TasksSdk,
    WebhooksSdk
} from "@webiny/sdk";
import { contentSdk as cmsContentSdk, environment as cmsEnvironment } from "@webiny/cms-sdk";
import { contentSdk as wbContentSdk } from "@webiny/website-builder-sdk";
import { CmsSdk } from "./CmsSdk.js";
import { WbSdk } from "./WbSdk.js";
import { ComponentsSdk } from "./ComponentsSdk.js";
import type { ContentSdkConfig } from "./types.js";

interface InitializedSdk {
    webiny: Webiny;
    cms: CmsSdk;
    wb: WbSdk;
    components: ComponentsSdk;
}

export class FrontendSdk {
    private sdk?: InitializedSdk;

    private get initialized(): InitializedSdk {
        if (!this.sdk) {
            throw new Error("SDK is not initialized. Call sdk.init() first.");
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

    get components(): ComponentsSdk {
        return this.initialized.components;
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
            wb: new WbSdk(),
            components: new ComponentsSdk({
                endpoint: config.endpoint,
                token: config.token,
                tenant: config.tenant || "root",
                fetch: config.fetch
            })
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

export const sdk = new FrontendSdk();
