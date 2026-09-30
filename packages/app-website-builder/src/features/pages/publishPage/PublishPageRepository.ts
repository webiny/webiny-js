import {
    PublishPageRepository as RepositoryAbstraction,
    PublishPageGateway
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import { WbPageStatus } from "~/constants.js";
import {
    PageListCache,
    FullPageCache,
    PageRevisionsCache
} from "~/features/pages/shared/abstractions.js";

class PublishPageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listCache: PageListCache.Interface,
        private detailsCache: FullPageCache.Interface,
        private revisionsCache: PageRevisionsCache.Interface,
        private gateway: PublishPageGateway.Interface
    ) {}

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        const publishedPage = Page.create(result);

        this.listCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return publishedPage;
            }
            return existingPage;
        });

        this.detailsCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return publishedPage;
            }
            return existingPage;
        });

        const publishedRevision = PageRevision.createFromPage(publishedPage);

        this.revisionsCache.updateItems(revision => {
            if (revision.id === publishedPage.id) {
                return publishedRevision;
            }

            // Only one revision of an entry can be published, so the previous one is now unpublished.
            if (
                revision.entryId === publishedPage.entryId &&
                revision.status === WbPageStatus.Published
            ) {
                return revision.withStatus(WbPageStatus.Unpublished);
            }

            return revision;
        });
    }
}

export const PublishPageRepository = RepositoryAbstraction.createImplementation({
    implementation: PublishPageRepositoryImpl,
    dependencies: [PageListCache, FullPageCache, PageRevisionsCache, PublishPageGateway]
});
