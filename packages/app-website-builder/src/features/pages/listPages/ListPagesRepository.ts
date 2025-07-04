import type {
    IListPagesRepository,
    IListPagesRepositoryParams
} from "~/features/pages/listPages/IListPagesRepository.js";
import { ListCache } from "~/features/pages/cache/index.js";
import { Page } from "~/features/pages/Page.js";
import type { IListPagesGateway } from "~/features/pages/listPages/IListPagesGateway.js";

export class ListPagesRepository implements IListPagesRepository {
    private cache: ListCache<Page>;
    private gateway: IListPagesGateway;

    constructor(cache: ListCache<Page>, gateway: IListPagesGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(params: IListPagesRepositoryParams) {
        const { pages } = await this.gateway.execute(params);
        this.cache.addItems(pages.map(page => Page.create(page)));
    }
}
