import { ModelAccessGuard } from "@webiny/api-headless-cms/features/contentModel/ModelAccessGuard/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { LANGUAGE_MODEL_ID } from "~/shared/constants.js";

interface LanguagesPermission {
    name: string;
    rwd?: string;
}

/**
 * The language model is a regular content model, so Headless CMS permissions alone would allow
 * changing languages. Creating, updating and deleting them requires the Languages permission
 * with write access. Reading is not restricted here.
 */
class LanguageModelAccessGuard implements ModelAccessGuard.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    canHandle(model: { modelId: string }): boolean {
        return model.modelId === LANGUAGE_MODEL_ID;
    }

    async canAccess(params: ModelAccessGuard.Params): Promise<boolean> {
        const isRead = !params.pw && (!params.rwd || params.rwd === "r");
        if (isRead) {
            return true;
        }

        const permission =
            await this.identityContext.getPermission<LanguagesPermission>("languages.*");
        if (!permission) {
            return false;
        }

        return permission.rwd !== "r";
    }
}

export default ModelAccessGuard.createImplementation({
    implementation: LanguageModelAccessGuard,
    dependencies: [IdentityContext]
});
