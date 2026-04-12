import {
    DuplicatePageRepository as RepositoryAbstraction,
    DuplicatePageGateway
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { PageListCache, WbPageMetaRepository } from "~/features/pages/shared/abstractions.js";

class DuplicatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageListCache.Interface,
        private meta: WbPageMetaRepository.Interface,
        private gateway: DuplicatePageGateway.Interface
    ) {}

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        this.cache.addItems([Page.create(result)]);
        await this.meta.increaseTotalCount();
    }
}

export const DuplicatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: DuplicatePageRepositoryImpl,
    dependencies: [PageListCache, WbPageMetaRepository, DuplicatePageGateway]
});
