import { createDecorator } from "@webiny/di";
import { PageModelBuilder as BuilderAbstraction } from "../abstractions.js";

class PageModelBuilderDecoratorImpl implements BuilderAbstraction.Interface {
    constructor(private decoratee: BuilderAbstraction.Interface) {}

    async buildModel() {
        const builder = await this.decoratee.buildModel();

        return builder
            .extendSchema(z => ({
                seo: z.object({
                    title: z.string()
                })
            }))
            .withMethods({
                hasSeoTitle() {
                    return this.extensions?.seo?.title !== "";
                }
            });
    }
}

export const PageModelBuilderDecorator = createDecorator({
    abstraction: BuilderAbstraction,
    decorator: PageModelBuilderDecoratorImpl,
    dependencies: []
});

declare module "~/models/simple/Page/abstractions.js" {
    interface IPage {
        hasSeoTitle(): boolean;
    }

    interface IPageExtensions {
        seo?: { title: string };
    }
}
