import type { IDeletePageRepository } from "~/features/pages/deletePage/IDeletePageRepository.js";

import type { IDeletePageGateway } from "~/features/pages/deletePage/IDeletePageGateway.js";
import { ListCache, Page } from "~/domains/Page/index.js";

export class DeletePageRepository implements IDeletePageRepository {
    private cache: ListCache<Page>;
    private gateway: IDeletePageGateway;

    constructor(cache: ListCache<Page>, gateway: IDeletePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        await this.gateway.execute(page.id);
        this.cache.removeItems(p => p.entryId === page.entryId);
    }
}
