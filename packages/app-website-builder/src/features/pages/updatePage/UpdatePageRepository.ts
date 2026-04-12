import {
    UpdatePageRepository as RepositoryAbstraction,
    UpdatePageGateway
} from "./abstractions.js";
import type { PageDto } from "./PageDto.js";
import { Page } from "~/domain/Page/Page.js";
import { PageListCache, FullPageCache } from "~/features/pages/shared/abstractions.js";

class UpdatePageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private listCache: PageListCache.Interface,
        private detailsCache: FullPageCache.Interface,
        private gateway: UpdatePageGateway.Interface
    ) {}

    async execute(page: Page) {
        const dto: PageDto = {
            id: page.id,
            properties: page.properties,
            metadata: page.metadata,
            elements: page.elements,
            bindings: page.bindings,
            extensions: page.extensions
        };

        const result = await this.gateway.execute(dto);

        this.listCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return Page.create(result);
            }
            return existingPage;
        });

        this.detailsCache.updateItems(existingPage => {
            if (existingPage.id === page.id) {
                return Page.create({
                    ...result,
                    elements: dto.elements,
                    bindings: dto.bindings
                });
            }
            return existingPage;
        });
    }
}

export const UpdatePageRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdatePageRepositoryImpl,
    dependencies: [PageListCache, FullPageCache, UpdatePageGateway]
});
