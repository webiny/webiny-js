import type { IMoveRedirectRepository } from "~/features/redirects/moveRedirect/IMoveRedirectRepository.js";
import type { IMoveRedirectGateway } from "~/features/redirects/moveRedirect/IMoveRedirectGateway.js";
import { type IListCache, Redirect } from "~/domain/Redirect/index.js";

export class MoveRedirectRepository implements IMoveRedirectRepository {
    private cache: IListCache<Redirect>;
    private gateway: IMoveRedirectGateway;

    constructor(cache: IListCache<Redirect>, gateway: IMoveRedirectGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(id: string, folderId: string): Promise<void> {
        await this.gateway.execute(id, folderId);
        this.cache.removeItems(p => p.id === id);
    }
}
