import { ModelsProvider as ProviderAbstraction } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { ModelFactory, FieldBuilderRegistry } from "~/features/modelBuilder/index.js";
import type { CmsModel } from "~/types/index.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { ModelBuilder } from "./ModelBuilder.js";

export class ModelsProvider implements ProviderAbstraction.Interface {
    public constructor(
        private getModels: () => ModelFactory.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface,
        private accessControl: AccessControl.Interface | undefined
    ) {}

    async list(tenant: string): Promise<CmsModel[]> {
        const modelImpls = this.getModels();
        const allModels: CmsModel[] = [];

        for (const modelImpl of modelImpls) {
            // Entry builder that determines model type
            const entryBuilder = new ModelBuilder(this.fieldsRegistry);

            // Get typed builders (array of private or public builders)
            const typedBuilders = await modelImpl.execute(entryBuilder);

            // Process each builder in the array
            for (const typedBuilder of typedBuilders) {
                const modelPlugin = typedBuilder.build();

                allModels.push({
                    ...modelPlugin.contentModel,
                    tenant,
                });
            }
        }

        if (!this.accessControl) {
            return allModels;
        }
        // Apply access control filtering
        return filterAsync(allModels, model => {
            return this.accessControl!.canAccessModel({ model });
        });
    }
}
