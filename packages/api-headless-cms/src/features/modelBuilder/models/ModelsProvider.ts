import { ModelsProvider as ProviderAbstraction } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { Model, FieldBuilderRegistry } from "~/features/modelBuilder/index.js";
import type { CmsModel } from "~/types/index.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { ModelBuilder } from "./ModelBuilder.js";

export class ModelsProvider implements ProviderAbstraction.Interface {
    constructor(
        private getModels: () => Model.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async list(tenant: string): Promise<CmsModel[]> {
        const modelImpls = this.getModels();
        const allModels: CmsModel[] = [];

        for (const modelImpl of modelImpls) {
            // Entry builder that determines model type
            const entryBuilder = new ModelBuilder(this.fieldsRegistry);

            // Get typed builder (private or public)
            const typedBuilder = await modelImpl.buildModel(entryBuilder);
            const modelPlugin = typedBuilder.build();

            allModels.push({
                ...modelPlugin.contentModel,
                tenant
            });
        }

        // Apply access control filtering
        return filterAsync(allModels, model => {
            return this.accessControl.canAccessModel({ model });
        });
    }
}
