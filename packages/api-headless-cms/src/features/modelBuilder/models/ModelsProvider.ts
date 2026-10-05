import { ModelsProvider as ProviderAbstraction } from "./abstractions.js";
import { ModelFactory } from "../abstractions.js";
import { FieldBuilderRegistry } from "../abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { ModelBuilder } from "./ModelBuilder.js";

export class ModelsProvider implements ProviderAbstraction.Interface {
    public constructor(
        private getModels: () => ModelFactory.Interface[],
        private fieldsRegistry: FieldBuilderRegistry.Interface
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
                    tenant
                });
            }
        }

        // No access control here: see PluginModelsProvider for why the model list is not filtered.
        return allModels;
    }
}
