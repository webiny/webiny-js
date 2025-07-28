import type { SecurityPermission } from "@webiny/api-security/types";
import { WebinyError } from "@webiny/error";
import { WebsiteBuilderContext } from "./types";

export abstract class BaseContext {
    protected context: WebsiteBuilderContext;

    protected constructor(context: WebsiteBuilderContext) {
        this.context = context;
    }

    protected getLocaleCode() {
        const locale = this.context.i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing locale on context.i18n locale in File Manager API.",
                "LOCALE_ERROR"
            );
        }
        return locale.code;
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
