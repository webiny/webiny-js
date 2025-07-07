import { IUpdatePageRepository } from "./IUpdatePageRepository.js";
import { ListCache } from "../cache";
import { IUpdatePageGateway } from "./IUpdatePageGateway.js";
import { PageDto } from "./PageDto.js";
import { Page } from "~/features/pages/Page.js";

export class UpdatePageRepository implements IUpdatePageRepository {
    private cache: ListCache<Page>;
    private gateway: IUpdatePageGateway;

    constructor(cache: ListCache<Page>, gateway: IUpdatePageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(page: Page) {
        const dto: PageDto = {
            id: page.id,
            entryId: page.entryId,
            status: page.status,
            wbyAco_location: page.location,
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
