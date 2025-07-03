import { ICreatePageRepository } from "./ICreatePageRepository.js";
import { ICreatePageGateway } from "./ICreatePageGateway.js";
import { PageDto } from "./PageDto.js";
import { Page } from "~/features/pages/Page.js";
import { ListCache } from "~/features/pages/cache/index.js";

export class CreatePageRepository implements ICreatePageRepository {
    private cache: ListCache<Page>;
    private gateway: ICreatePageGateway;

    constructor(cache: ListCache<Page>, gateway: ICreatePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const dto: PageDto = {
            wbyAco_location: page.location,
            properties: page.properties,
            elements: page.elements,
            bindings: page.bindings,
            extensions: page.extensions
        };

        const result = await this.gateway.execute(dto);
        this.cache.addItems([Page.create(result)]);
    }
}
