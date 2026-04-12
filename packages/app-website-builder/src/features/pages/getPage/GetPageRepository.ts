import { GetPageRepository as RepositoryAbstraction, GetPageGateway } from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";
import { FullPageCache } from "~/features/pages/shared/abstractions.js";

class GetPageRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FullPageCache.Interface,
        private gateway: GetPageGateway.Interface
    ) {}

    async execute(id: string) {
        const existingPage = this.cache.getItem(page => page.id === id);
        if (existingPage) {
            return existingPage;
        }

        const response = await this.gateway.execute(id);
        const page = Page.create(response);
        this.cache.addItems([page]);
        return page;
    }
}

export const GetPageRepository = RepositoryAbstraction.createImplementation({
    implementation: GetPageRepositoryImpl,
    dependencies: [FullPageCache, GetPageGateway]
});
