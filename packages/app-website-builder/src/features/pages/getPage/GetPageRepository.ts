import { IGetPageRepository } from "./IGetPageRepository.js";
import { IGetPageGateway } from "./IGetPageGateway.js";
import { type IListCache, Page } from "~/domain/Page/index.js";

export class GetPageRepository implements IGetPageRepository {
    private cache: IListCache<Page>;
    private gateway: IGetPageGateway;

    constructor(cache: IListCache<Page>, gateway: IGetPageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(id: string) {
        const response = await this.gateway.execute(id);
        this.cache.addItems([Page.create(response)]);
    }
}
