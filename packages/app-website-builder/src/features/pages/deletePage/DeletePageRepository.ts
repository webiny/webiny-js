import type { IDeletePageRepository } from "~/features/pages/deletePage/IDeletePageRepository.js";
import { ListCache } from "~/features/pages/cache/index.js";
import type { Page } from "~/features/pages/Page.js";
import type { IDeletePageGateway } from "~/features/pages/deletePage/IDeletePageGateway.js";

export class DeletePageRepository implements IDeletePageRepository {
    private cache: ListCache<Page>;
    private gateway: IDeletePageGateway;

    constructor(cache: ListCache<Page>, gateway: IDeletePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        await this.gateway.execute(page.id);
        this.cache.removeItems(f => f.id === page.id);
    }
}
