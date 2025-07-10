import type { IDuplicatePageRepository } from "~/features/pages/duplicatePage/IDuplicatePageRepository.js";
import { type IListCache, Page } from "~/domain/Page/index.js";
import type { IDuplicatePageGateway } from "~/features/pages/duplicatePage/IDuplicatePageGateway.js";
import type { IMetaRepository } from "@webiny/app-utils";

export class DuplicatePageRepository implements IDuplicatePageRepository {
    private cache: IListCache<Page>;
    private meta: IMetaRepository;
    private gateway: IDuplicatePageGateway;

    constructor(cache: IListCache<Page>, meta: IMetaRepository, gateway: IDuplicatePageGateway) {
        this.cache = cache;
        this.meta = meta;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const result = await this.gateway.execute(page.id);
        this.cache.addItems([Page.create(result)]);
        await this.meta.increaseTotalCount();
    }
}
