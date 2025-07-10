import type { IDeletePageRepository } from "~/features/pages/deletePage/IDeletePageRepository.js";
import type { IDeletePageGateway } from "~/features/pages/deletePage/IDeletePageGateway.js";
import { type IListCache, Page } from "~/domain/Page/index.js";
import type { IMetaRepository } from "@webiny/app-utils";

export class DeletePageRepository implements IDeletePageRepository {
    private cache: IListCache<Page>;
    private meta: IMetaRepository;
    private gateway: IDeletePageGateway;

    constructor(cache: IListCache<Page>, meta: IMetaRepository, gateway: IDeletePageGateway) {
        this.cache = cache;
        this.meta = meta;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        await this.gateway.execute(page.id);
        this.cache.removeItems(p => p.id === page.id);
        await this.meta.decreaseTotalCount();
    }
}
