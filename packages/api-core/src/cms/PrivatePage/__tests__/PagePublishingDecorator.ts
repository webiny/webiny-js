import { createDecorator } from "@webiny/di-container";
import { PageCmsModelBuilder } from "~/cms/PrivatePage/abstractions.js";

class PagePublishingDecoratorImpl implements PageCmsModelBuilder.Interface {
    constructor(private decoratee: PageCmsModelBuilder.Interface) {}

    async buildCmsModel() {
        const builder = await this.decoratee.buildCmsModel();

        return builder
            .extendFields(fields => ({
                publishedAt: fields.text().label("Published At"),
                publishedBy: fields.text().label("Published By"),
                status: fields.text().label("Status")
            }))
            .withMethods({
                publish(userId: string) {
                    if (!this.extensions) {
                        this.extensions = {};
                    }
                    this.extensions.publishedAt = new Date().toISOString();
                    this.extensions.publishedBy = userId;
                    this.extensions.status = "published";
                },
                unpublish() {
                    if (!this.extensions) {
                        this.extensions = {};
                    }
                    this.extensions.status = "draft";
                },
                isPublished() {
                    return this.extensions?.status === "published";
                },
                isDraft() {
                    return !this.extensions?.status || this.extensions.status === "draft";
                }
            });
    }
}

export const PagePublishingDecorator = createDecorator({
    abstraction: PageCmsModelBuilder,
    decorator: PagePublishingDecoratorImpl,
    dependencies: []
});

declare module "~/cms/PrivatePage/abstractions.js" {
    interface IPage {
        publish(userId: string): void;
        unpublish(): void;
        isPublished(): boolean;
        isDraft(): boolean;
    }

    interface IPageExtensions {
        publishedAt?: string;
        publishedBy?: string;
        status?: "draft" | "published" | "archived";
    }
}
