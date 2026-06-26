import {
    PublishPageRepository as RepositoryAbstraction,
    PublishPageGateway
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageListCache, FullPageCache } from "~/features/pages/shared/abstractions.js";

class PublishPageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listCache: PageListCache.Interface,
        private detailsCache: FullPageCache.Interface,
        private gateway: PublishPageGateway.Interface
    ) {}

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);

        this.listCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return Page.create(result);
            }
            return existingPage;
        });

        this.detailsCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return Page.create(result);
            }
            return existingPage;
        });
    }
}

export const PublishPageRepository = RepositoryAbstraction.createImplementation({
    implementation: PublishPageRepositoryImpl,
    dependencies: [PageListCache, FullPageCache, PublishPageGateway]
});
