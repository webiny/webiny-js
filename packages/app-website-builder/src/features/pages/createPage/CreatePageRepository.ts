import type { ICreatePageRepository } from "./ICreatePageRepository.js";
import type { ICreatePageGateway } from "./ICreatePageGateway.js";
import type { PageDto } from "./PageDto.js";
import { type IListCache, Page } from "~/domain/Page/index.js";

export class CreatePageRepository implements ICreatePageRepository {
    private cache: IListCache<Page>;
    private gateway: ICreatePageGateway;

    constructor(cache: IListCache<Page>, gateway: ICreatePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const dto: PageDto = {
            location: page.location,
            properties: page.properties,
            metadata: page.metadata,
            elements: page.elements,
            bindings: page.bindings,
            extensions: page.extensions
        };

        const result = await this.gateway.execute(dto);
        const newPage = Page.create(result);
        this.cache.addItems([newPage]);
        return newPage;
    }
}
