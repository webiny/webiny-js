import { WebinyError } from "@webiny/error";
import type { WebsiteBuilderContext } from "./types.js";
import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

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
        const getModel = this.context.container.resolve(GetModelUseCase);
        const identityContext = this.context.container.resolve(IdentityContext);
        const modelResult = await identityContext.withoutAuthorization(() => {
            return getModel.execute(modelId);
        });

        if (modelResult.isFail()) {
            console.error("Get model error", modelResult.error.message);
            throw new WebinyError({
                code: "MODEL_NOT_FOUND",
                message: `Content model "${modelId}" was not found!`
            });
        }

        return modelResult.value;
    }
}
