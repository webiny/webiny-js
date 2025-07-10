import { ICreatePageRepository } from "./ICreatePageRepository.js";
import { ICreatePageGateway } from "./ICreatePageGateway.js";
import { PageDto } from "./PageDto.js";
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
            wbyAco_location: page.location,
            properties: page.properties,
            metadata: page.metadata,
            elements: page.elements,
            bindings: page.bindings,
            extensions: page.extensions
        };

        const result = await this.gateway.execute(dto);
        this.cache.addItems([Page.create(result)]);
    }
}
