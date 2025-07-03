import { ListCache } from "../cache";
import { IGetPageRepository } from "./IGetPageRepository.js";
import { IGetPageGateway } from "./IGetPageGateway.js";
import { Page } from "~/features/pages/Page.js";

export class GetPageRepository implements IGetPageRepository {
    private cache: ListCache<Page>;
    private gateway: IGetPageGateway;

    constructor(cache: ListCache<Page>, gateway: IGetPageGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(id: string) {
        const response = await this.gateway.execute(id);
        this.cache.addItems([Page.create(response)]);
    }
}
