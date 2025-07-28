import type { IMetaRepository } from "@webiny/app-utils";
import type { IDeleteRedirectRepository } from "~/features/redirects/deleteRedirect/IDeleteRedirectRepository.js";
import type { IDeleteRedirectGateway } from "~/features/redirects/deleteRedirect/IDeleteRedirectGateway.js";
import { type IListCache, Redirect } from "~/domain/Redirect/index.js";

export class DeleteRedirectRepository implements IDeleteRedirectRepository {
    private cache: IListCache<Redirect>;
    private meta: IMetaRepository;
    private gateway: IDeleteRedirectGateway;

    constructor(cache: IListCache<Redirect>, meta: IMetaRepository, gateway: IDeleteRedirectGateway) {
        this.cache = cache;
        this.meta = meta;
        this.gateway = gateway;
    }

    async execute(redirect: Redirect) {
        await this.gateway.execute(redirect.id);
        this.cache.removeItems(p => p.id === redirect.id);
        await this.meta.decreaseTotalCount();
    }
}
