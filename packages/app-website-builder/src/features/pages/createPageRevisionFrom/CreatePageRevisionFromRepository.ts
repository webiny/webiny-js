import type { ICreatePageRevisionFromRepository } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromRepository.js";
import type { ICreatePageRevisionFromGateway } from "~/features/pages/createPageRevisionFrom/ICreatePageRevisionFromGateway.js";
import { type IListCache, Page } from "~/domain/Page/index.js";

export class CreatePageRevisionFromRepository implements ICreatePageRevisionFromRepository {
    private cache: IListCache<Page>;
    private gateway: ICreatePageRevisionFromGateway;

    constructor(cache: IListCache<Page>, gateway: ICreatePageRevisionFromGateway) {
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
