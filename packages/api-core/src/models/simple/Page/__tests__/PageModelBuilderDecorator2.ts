import { createDecorator } from "@webiny/di-container";
import { PageModelBuilder as BuilderAbstraction } from "../abstractions.js";

class PageModelBuilderDecorator2Impl implements BuilderAbstraction.Interface {
    constructor(private decoratee: BuilderAbstraction.Interface) {}

    async buildModel() {
        const builder = await this.decoratee.buildModel();

        return builder.extendSchema(z => ({
            social: z.object({
                description: z.string()
            })
        }));
    }
}

export const PageModelBuilderDecorator2 = createDecorator({
    abstraction: BuilderAbstraction,
    decorator: PageModelBuilderDecorator2Impl,
    dependencies: []
});

declare module "~/models/simple/Page/abstractions.js" {
    interface IPageExtensions {
        social?: { description: string };
    }
}
