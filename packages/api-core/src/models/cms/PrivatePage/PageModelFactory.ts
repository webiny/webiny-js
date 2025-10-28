import { createImplementation } from "@webiny/di-container";
import {
    PageModelFactory as FactoryAbstraction,
    PageCmsModelBuilder,
    type IPage
} from "./abstractions.js";
import type { ModelClass } from "~/models/ModelBuilder.js";
import type { PrivateCmsModel } from "~/cms/types.js";

class PageModelFactoryImpl implements FactoryAbstraction.Interface {
    private modelClass: ModelClass<IPage> | undefined;
    private cmsModel: PrivateCmsModel<IPage> | undefined;

    constructor(private cmsModelBuilder: PageCmsModelBuilder.Interface) {}

    async create(data: FactoryAbstraction.CreateInput): Promise<IPage> {
        if (this.modelClass) {
            return this.modelClass.create(data);
        }

        // Build the CMS model configuration
        const builder = await this.cmsModelBuilder.buildCmsModel();

        // Build the final model
        this.cmsModel = builder.build();
        this.modelClass = this.cmsModel.Model;

        return this.modelClass.create(data);
    }

    // Optional: expose the CMS model metadata
    getCmsModel(): PrivateCmsModel<IPage> | undefined {
        return this.cmsModel;
    }
}

export const PageModelFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: PageModelFactoryImpl,
    dependencies: [PageCmsModelBuilder]
});
