import type { ICreatePageRevisionFromRepository } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromRepository.js";
import { ListCache } from "~/features/pages/cache/index.js";
import { Page } from "~/features/pages/Page.js";
import type { ICreatePageRevisionFromGateway } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromGateway.js";

export class CreatePageRevisionFromRepository implements ICreatePageRevisionFromRepository {
    private cache: ListCache<Page>;
    private gateway: ICreatePageRevisionFromGateway;

    constructor(cache: ListCache<Page>, gateway: ICreatePageRevisionFromGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        this.cache.addItems([Page.create(result)]);
    }
}
