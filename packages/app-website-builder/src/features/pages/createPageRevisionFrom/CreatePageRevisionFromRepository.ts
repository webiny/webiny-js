import {
    CreatePageRevisionFromRepository as RepositoryAbstraction,
    CreatePageRevisionFromGateway
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";

class CreatePageRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageListCache.Interface,
        private gateway: CreatePageRevisionFromGateway.Interface
    ) {}

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        const newPage = Page.create(result);

        this.cache.updateItems(p => {
            if (p.id === page.id) {
                return newPage;
            }
            return p;
        });

        return newPage;
    }
}

export const CreatePageRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreatePageRevisionFromRepositoryImpl,
    dependencies: [PageListCache, CreatePageRevisionFromGateway]
});
