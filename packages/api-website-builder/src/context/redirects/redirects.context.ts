import { CmsModelPlugin, createModelField, createPrivateModel } from "@webiny/api-headless-cms";
import type { WebsiteBuilderContext } from "~/context/types";
import { BaseContext } from "~/context/BaseContext";
import { RedirectsStorage } from "./RedirectsStorage";
import { WbRedirectCrud } from "~/context/redirects/redirects.types";
import { createRedirectsCrud } from "~/context/redirects/redirects.crud";

export const REDIRECT_MODEL_ID = "wbRedirect";

export class RedirectsContext extends BaseContext {
    private constructor(context: WebsiteBuilderContext) {
        super(context);
    }

    private async init() {
        const storageOperations = await this.setupStorageOperations();

        return createRedirectsCrud({
            storageOperations,
            getTenantId: this.getTenantId.bind(this),
            getLocaleCode: this.getLocaleCode.bind(this),
            getIdentity: this.getIdentity.bind(this),
            getPermissions: this.getPermissions.bind(this)
        });
    }

    private async setupStorageOperations() {
        return this.context.security.withoutAuthorization(async () => {
            // This registers code plugins (model group, models)
            const modelDefinition = this.createModelDefinition();

            // Finally, register all plugins
            this.context.plugins.register([new CmsModelPlugin(modelDefinition)]);

            // Now load the page model registered in the previous step
            const model = await this.getModel(REDIRECT_MODEL_ID);

            // Overwrite the original `pages` storage ops
            return await RedirectsStorage.create({
                model,
                cms: this.context.cms,
                plugins: this.context.plugins
            });
        });
    }

    static async create(context: WebsiteBuilderContext): Promise<WbRedirectCrud> {
        const pagesContext = new RedirectsContext(context);
        return pagesContext.init();
    }

    private createModelDefinition() {
        return createPrivateModel({
            name: "Website Builder - Redirect",
            modelId: REDIRECT_MODEL_ID,
            titleFieldId: "from",
            authorization: {
                // Disables base permission checks, but leaves FLP checks enabled.
                permissions: false
            },
            fields: [
                createModelField({
                    fieldId: "redirectFrom",
                    label: "Redirect From",
                    type: "text"
                }),
                createModelField({
                    fieldId: "redirectTo",
                    label: "Redirect To",
                    type: "text"
                }),
                createModelField({
                    fieldId: "redirectType",
                    label: "Redirect Type",
                    type: "text"
                }),
                createModelField({
                    fieldId: "isEnabled",
                    label: "Is enabled?",
                    type: "boolean"
                })
            ]
        });
    }
}
