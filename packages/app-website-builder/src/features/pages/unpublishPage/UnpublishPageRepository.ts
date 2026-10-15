import {
    UnpublishPageRepository as RepositoryAbstraction,
    UnpublishPageGateway
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import {
    PageListCache,
    FullPageCache,
    PageRevisionsCache
} from "~/features/pages/shared/abstractions.js";

class UnpublishPageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listCache: PageListCache.Interface,
        private detailsCache: FullPageCache.Interface,
        private revisionsCache: PageRevisionsCache.Interface,
        private gateway: UnpublishPageGateway.Interface
    ) {}

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        const unpublishedPage = Page.create(result);

        this.listCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return unpublishedPage;
            }
            return existingPage;
        });

        this.detailsCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return unpublishedPage;
            }
            return existingPage;
        });

        this.revisionsCache.updateItems(revision => {
            if (revision.id === unpublishedPage.id) {
                return PageRevision.createFromPage(unpublishedPage);
            }
            return revision;
        });
    }
}

export const UnpublishPageRepository = RepositoryAbstraction.createImplementation({
    implementation: UnpublishPageRepositoryImpl,
    dependencies: [PageListCache, FullPageCache, PageRevisionsCache, UnpublishPageGateway]
});
