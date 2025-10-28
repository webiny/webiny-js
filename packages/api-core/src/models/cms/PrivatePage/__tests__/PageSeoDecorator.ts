import { createDecorator } from "@webiny/di-container";
import { PageCmsModelBuilder } from "~/cms/PrivatePage/abstractions.js";

class PageSeoDecoratorImpl implements PageCmsModelBuilder.Interface {
    constructor(private decoratee: PageCmsModelBuilder.Interface) {}

    async buildCmsModel() {
        const builder = await this.decoratee.buildCmsModel();

        return builder
            .extendFields(fields => ({
                seo: fields
                    .object(reg => ({
                        title: reg.text().label("SEO Title"),
                        description: reg.text().label("SEO Description"),
                        keywords: reg.text().label("Keywords")
                    }))
                    .label("SEO Settings")
            }))
            .withMethods({
                getSeoTitle() {
                    return this.extensions?.seo?.title || this.title;
                },
                hasSeo() {
                    return !!this.extensions?.seo?.title;
                }
            });
    }
}

export const PageSeoDecorator = createDecorator({
    abstraction: PageCmsModelBuilder,
    decorator: PageSeoDecoratorImpl,
    dependencies: []
});

// Module augmentation
declare module "~/cms/PrivatePage/abstractions.js" {
    interface IPage {
        getSeoTitle(): string;
        hasSeo(): boolean;
    }

    interface IPageExtensions {
        seo?: {
            title: string;
            description: string;
            keywords: string;
        };
    }
}
