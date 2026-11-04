import {
    CreatePageRevisionFromRepository as RepositoryAbstraction,
    CreatePageRevisionFromGateway
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import { PageListCache, PageRevisionsCache } from "~/features/pages/shared/abstractions.js";

class CreatePageRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageListCache.Interface,
        private revisionsCache: PageRevisionsCache.Interface,
        private gateway: CreatePageRevisionFromGateway.Interface
    ) {}

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        const newPage = Page.create(result);

        // The page list only ever shows the latest revision, so the source revision is replaced.
        this.cache.updateItems(p => {
            if (p.id === page.id) {
                return newPage;
            }
            return p;
        });

        // The revisions list, on the other hand, shows every revision, so this is an insert.
        this.revisionsCache.addItems([PageRevision.createFromPage(newPage)]);

        return newPage;
    }
}

export const CreatePageRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreatePageRevisionFromRepositoryImpl,
    dependencies: [PageListCache, PageRevisionsCache, CreatePageRevisionFromGateway]
});
