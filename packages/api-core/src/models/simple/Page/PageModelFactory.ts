import { createImplementation } from "@webiny/di-container";
import {
    PageModelFactory as FactoryAbstraction,
    PageModelBuilder,
    type IPage
} from "./abstractions.js";
import type { ModelClass } from "~/models/base/ModelBuilder.js";

class PageModelFactoryImpl implements FactoryAbstraction.Interface {
    private modelClass: ModelClass<IPage> | undefined;

    constructor(private modelBuilder: PageModelBuilder.Interface) {}

    async create(data: FactoryAbstraction.CreateInput): Promise<IPage> {
        if (this.modelClass) {
            return this.modelClass.create(data);
        }

        const builder = await this.modelBuilder.buildModel();
        this.modelClass = builder.build();

        return this.modelClass.create(data);
    }
}

export const PageModelFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: PageModelFactoryImpl,
    dependencies: [PageModelBuilder]
});
