import type { IPublishPageRepository } from "~/features/pages/publishPage/IPublishPageRepository.js";
import type { IPublishPageGateway } from "~/features/pages/publishPage/IPublishPageGateway.js";
import { type IListCache, Page } from "~/domains/Page/index.js";

export class PublishPageRepository implements IPublishPageRepository {
    private cache: IListCache<Page>;
    private gateway: IPublishPageGateway;

    constructor(cache: IListCache<Page>, gateway: IPublishPageGateway) {
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
