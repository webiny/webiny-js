import { WebsiteBuilderContext } from "~/context/types";
import { WbPageCrud } from "~/context/pages/pages.types";
import { BaseContext } from "~/context/BaseContext";
import { CmsModelPlugin, createModelField, createPrivateModel } from "@webiny/api-headless-cms";
import { PagesStorage } from "~/context/pages/PagesStorage";
import { createPagesCrud } from "~/context/pages/pages.crud";

export const PAGE_MODEL_ID = "wbPage";

export class PagesContext extends BaseContext {
    private constructor(context: WebsiteBuilderContext) {
        super(context);
    }

    private async init() {
        const storageOperations = await this.setupStorageOperations();

        return createPagesCrud({
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
            const model = await this.getModel(PAGE_MODEL_ID);

            // Overwrite the original `pages` storage ops
            return await PagesStorage.create({
                model,
                cms: this.context.cms,
                plugins: this.context.plugins
            });
        });
    }

    static async create(context: WebsiteBuilderContext): Promise<WbPageCrud> {
        const pagesContext = new PagesContext(context);
        return pagesContext.init();
    }

    private createModelDefinition() {
        return createPrivateModel({
            name: "Website Builder - Page",
            modelId: PAGE_MODEL_ID,
            titleFieldId: "properties.title",
            authorization: {
                // Disables base permission checks, but leaves FLP checks enabled.
                permissions: false
            },
            fields: [
                createModelField({
                    label: "Properties",
                    type: "searchable-json"
                }),
                createModelField({
                    label: "Properties",
                    type: "searchable-json"
                }),
                createModelField({
                    label: "Bindings",
                    type: "json"
                }),
                createModelField({
                    label: "Elements",
                    type: "json"
                }),
                createModelField({
                    label: "Extensions",
                    fieldId: "extensions",
                    type: "searchable-json"
                })
            ]
        });
    }
}
