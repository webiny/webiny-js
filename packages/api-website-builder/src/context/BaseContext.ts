import { WebinyError } from "@webiny/error";
import type { WebsiteBuilderContext } from "./types.js";
import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export abstract class BaseContext {
    protected context: WebsiteBuilderContext;

    protected constructor(context: WebsiteBuilderContext) {
        this.context = context;
    }

    protected getLocaleCode() {
        return getLocale().code;
    }

    protected getIdentity() {
        return this.context.security.getIdentity();
    }

    protected getTenantId() {
        return this.context.tenancy.getCurrentTenant().id;
    }

    protected async getPermissions<T extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<T[]> {
        return this.context.security.getPermissions(name);
    }

    protected async getModel(modelId: string) {
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
