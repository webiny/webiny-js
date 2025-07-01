import WebinyError from "@webiny/error";
import { CmsModelPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { createPageModel, PAGE_MODEL_ID } from "~/page/page.model";
import type { SecurityPermission } from "@webiny/api-security/types";
import type { WebsiteBuilderContext, WebsiteBuilderStorageOperations } from "~/types";
import { createWebsiteBuilder } from "~/createWebsiteBuilder";
import { CmsModelModifierPlugin } from "~/page/page.modelModifier";
import { CmsPagesStorage } from "~/page/CmsPagesStorage";

export class WebsiteBuilderContextSetup {
    private readonly context: WebsiteBuilderContext;

    constructor(context: WebsiteBuilderContext) {
        this.context = context;
    }

    async setupContext() {
        const storageOperations = {} as WebsiteBuilderStorageOperations;

        const pageStorageOps = await this.context.security.withoutAuthorization(() => {
            return this.setupPageCmsStorageOperations();
        });

        if (pageStorageOps) {
            storageOperations.pages = pageStorageOps;
        }

        return createWebsiteBuilder({
            storageOperations,
            getTenantId: this.getTenantId.bind(this),
            getLocaleCode: this.getLocaleCode.bind(this),
            getIdentity: this.getIdentity.bind(this),
            getPermissions: this.getPermissions.bind(this),
            // TODO: maybe this is no longer necessary, as this wil be managed by CMS?
            WEBINY_VERSION: this.context.WEBINY_VERSION
        });
    }

    private getLocaleCode() {
        const locale = this.context.i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing locale on context.i18n locale in File Manager API.",
                "LOCALE_ERROR"
            );
        }
        return locale.code;
    }

    private getIdentity() {
        return this.context.security.getIdentity();
    }

    private getTenantId() {
        return this.context.tenancy.getCurrentTenant().id;
    }

    private async getPermissions<T extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<T[]> {
        return this.context.security.getPermissions(name);
    }

    private async setupPageCmsStorageOperations() {
        if (!(await isHeadlessCmsReady(this.context))) {
            console.log("Installation pending!");
            return;
        }

        // This registers code plugins (model group, models)
        const pageModelDefinition = createPageModel();

        const modelModifiers = this.context.plugins.byType<CmsModelModifierPlugin>(
            CmsModelModifierPlugin.type
        );

        for (const modifier of modelModifiers) {
            await modifier.modifyModel(pageModelDefinition);
        }

        // Finally, register all plugins
        this.context.plugins.register([new CmsModelPlugin(pageModelDefinition)]);

        // Now load the page model registered in the previous step
        const pageModel = await this.getModel(PAGE_MODEL_ID);

        // Overwrite the original `pages` storage ops
        return await CmsPagesStorage.create({
            pageModel,
            cms: this.context.cms
        });
    }

    private async getModel(modelId: string) {
        const model = await this.context.cms.getModel(modelId);
        if (!model) {
            throw new WebinyError({
                code: "MODEL_NOT_FOUND",
                message: `Content model "${modelId}" was not found!`
            });
        }

        return model;
    }
}
