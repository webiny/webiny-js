import type { ICreatePageRevisionFromRepository } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromRepository.js";
import type { ICreatePageRevisionFromGateway } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromGateway.js";
import { ListCache, Page } from "~/domains/Page/index.js";

export class CreatePageRevisionFromRepository implements ICreatePageRevisionFromRepository {
    private cache: ListCache<Page>;
    private gateway: ICreatePageRevisionFromGateway;

    constructor(cache: ListCache<Page>, gateway: ICreatePageRevisionFromGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        this.cache.updateItems(p => {
            if (p.entryId === page.entryId) {
                return Page.create(result);
            }

            return Page.create(p);
        });
    }
}
