import type { IPublishPageRepository } from "~/features/pages/publishPage/IPublishPageRepository.js";
import { ListCache } from "~/features/pages/cache/index.js";
import { Page } from "~/features/pages/Page.js";
import type { IPublishPageGateway } from "~/features/pages/publishPage/IPublishPageGateway.js";

export class PublishPageRepository implements IPublishPageRepository {
    private cache: ListCache<Page>;
    private gateway: IPublishPageGateway;

    constructor(cache: ListCache<Page>, gateway: IPublishPageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        this.cache.updateItems(p => {
            if (p.id === page.id) {
                return Page.create(result);
            }

            return Page.create(p);
        });
    }
}
