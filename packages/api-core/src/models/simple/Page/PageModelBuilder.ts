import { createImplementation } from "@webiny/di-container";
import { ModelBuilder as Builder } from "~/models/base/ModelBuilder.js";
import { PageSchema, PageModelBuilder as BuilderAbstraction, type IPage } from "./abstractions.js";

class PageModelBuilderImpl implements BuilderAbstraction.Interface {
    async buildModel() {
        return new Builder<IPage>("Page", PageSchema).withMethods({
            hasTitle() {
                return this.title !== "";
            },
            cancel() {}
        });
    }
}

export const PageModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: PageModelBuilderImpl,
    dependencies: []
});
