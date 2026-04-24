import {
    DeletePageRepository as RepositoryAbstraction,
    DeletePageGateway
} from "./abstractions.js";
import type { Page } from "~/domain/Page/Page.js";
import { PageListCache, WbPageMetaRepository } from "~/features/pages/shared/abstractions.js";

class DeletePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageListCache.Interface,
        private meta: WbPageMetaRepository.Interface,
        private gateway: DeletePageGateway.Interface
    ) {}

    async execute(page: Page, permanently = false) {
        await this.gateway.execute(page.id, permanently);
        this.cache.removeItems(p => p.id === page.id);
        await this.meta.decreaseTotalCount();
    }
}

export const DeletePageRepository = RepositoryAbstraction.createImplementation({
    implementation: DeletePageRepositoryImpl,
    dependencies: [PageListCache, WbPageMetaRepository, DeletePageGateway]
});
