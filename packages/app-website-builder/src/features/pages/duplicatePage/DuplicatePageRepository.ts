import type { IDuplicatePageRepository } from "~/features/pages/duplicatePage/IDuplicatePageRepository.js";
import { ListCache, Page } from "~/domains/Page/index.js";
import type { IDuplicatePageGateway } from "~/features/pages/duplicatePage/IDuplicatePageGateway.js";

export class DuplicatePageRepository implements IDuplicatePageRepository {
    private cache: ListCache<Page>;
    private gateway: IDuplicatePageGateway;

    constructor(cache: ListCache<Page>, gateway: IDuplicatePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        this.cache.addItems([Page.create(result)]);
    }
}
