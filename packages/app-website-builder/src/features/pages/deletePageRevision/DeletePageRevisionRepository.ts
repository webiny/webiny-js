import {
    DeletePageRevisionGateway,
    DeletePageRevisionRepository as RepositoryAbstraction
} from "./abstractions.js";
import type { Page } from "~/domain/Page/Page.js";
import { PageRevisionsCache } from "~/features/pages/shared/abstractions.js";

class DeletePageRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly revisionsCache: PageRevisionsCache.Interface,
        private readonly gateway: DeletePageRevisionGateway.Interface
    ) {}

    async execute(page: Page) {
        await this.gateway.execute(page.id);

        this.revisionsCache.removeItems(revision => revision.id === page.id);
    }
}

export const DeletePageRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeletePageRevisionRepositoryImpl,
    dependencies: [PageRevisionsCache, DeletePageRevisionGateway]
});
