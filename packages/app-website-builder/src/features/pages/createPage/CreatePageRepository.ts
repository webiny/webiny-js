import {
    CreatePageRepository as RepositoryAbstraction,
    CreatePageGateway
} from "./abstractions.js";
import type { PageDto } from "./PageDto.js";
import { Page } from "~/domain/Page/Page.js";
import { PageListCache } from "~/features/pages/shared/abstractions.js";

class CreatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: PageListCache.Interface,
        private gateway: CreatePageGateway.Interface
    ) {}

    async execute(page: Page) {
        const dto: PageDto = {
            location: page.location,
            properties: page.properties,
            metadata: page.metadata,
            elements: page.elements,
            bindings: page.bindings,
            extensions: page.extensions
        };

        const result = await this.gateway.execute(dto);
        const newPage = Page.create(result);
        this.cache.addItems([newPage]);
        return newPage;
    }
}

export const CreatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: CreatePageRepositoryImpl,
    dependencies: [PageListCache, CreatePageGateway]
});
