import { ListCache } from "~/features/pages/cache/index.js";
import { Page } from "~/features/pages/Page.js";
import type { IUnpublishPageRepository } from "~/features/pages/unpublishPage/IUnpublishPageRepository.js";
import type { IUnpublishPageGateway } from "~/features/pages/unpublishPage/IUnpublishPageGateway.js";

export class UnpublishPageRepository implements IUnpublishPageRepository {
    private cache: ListCache<Page>;
    private gateway: IUnpublishPageGateway;

    constructor(cache: ListCache<Page>, gateway: IUnpublishPageGateway) {
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
