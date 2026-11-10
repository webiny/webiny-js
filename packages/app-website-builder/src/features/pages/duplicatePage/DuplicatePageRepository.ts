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
        const duplicate = Page.create(result);
        this.cache.addItems([duplicate]);
        await this.meta.increaseTotalCount();
        return duplicate;
    }
}

export const DuplicatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: DuplicatePageRepositoryImpl,
    dependencies: [PageListCache, WbPageMetaRepository, DuplicatePageGateway]
});
