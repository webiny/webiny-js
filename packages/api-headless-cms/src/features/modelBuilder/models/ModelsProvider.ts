import {
    ModelsProvider as ProviderAbstraction,
    PublicModelProvider,
    PrivateModelProvider
} from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { ensureTypeTag } from "~/crud/contentModel/ensureTypeTag.js";

class ModelsProviderImpl implements ProviderAbstraction.Interface {
    constructor(
        private publicProvider: PublicModelProvider.Interface,
        private privateProvider: PrivateModelProvider.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async list(tenant: string): Promise<CmsModel[]> {
        // Get models from both providers
        const publicModels = await this.publicProvider.getModels();
        const privateModels = await this.privateProvider.getModels();

        // Combine and tag models with tenant
        const allModels = [...publicModels, ...privateModels].map<CmsModel>(model => ({
            ...model,
            tags: ensureTypeTag(model),
            tenant
        }));

        // Apply access control filtering
        return filterAsync(allModels, model => {
            return this.accessControl.canAccessModel({ model });
        });
    }
}

export const ModelsProvider = ProviderAbstraction.createImplementation({
    implementation: ModelsProviderImpl,
    dependencies: [PublicModelProvider, PrivateModelProvider, AccessControl]
});
