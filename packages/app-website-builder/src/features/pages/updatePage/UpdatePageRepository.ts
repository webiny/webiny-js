import { IUpdatePageRepository } from "./IUpdatePageRepository.js";
import { IUpdatePageGateway } from "./IUpdatePageGateway.js";
import { PageDto } from "./PageDto.js";
import { type IListCache, Page } from "~/domain/Page/index.js";

export class UpdatePageRepository implements IUpdatePageRepository {
    private cache: IListCache<Page>;
    private gateway: IUpdatePageGateway;

    constructor(cache: IListCache<Page>, gateway: IUpdatePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const dto: PageDto = {
            id: page.id,
            properties: page.properties,
            metadata: page.metadata,
            elements: page.elements,
            bindings: page.bindings,
            extensions: page.extensions
        };

        const result = await this.gateway.execute(dto);

        this.cache.updateItems(p => {
            if (p.id === page.id) {
                return Page.create(result);
            }

            return Page.create(p);
        });
    }
}
