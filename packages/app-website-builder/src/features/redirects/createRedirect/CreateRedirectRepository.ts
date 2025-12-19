import type { ICreateRedirectRepository } from "./ICreateRedirectRepository.js";
import type { ICreateRedirectGateway } from "./ICreateRedirectGateway.js";
import type { RedirectDto } from "./RedirectDto.js";
import { type IListCache, Redirect } from "~/domain/Redirect/index.js";

export class CreateRedirectRepository implements ICreateRedirectRepository {
    private cache: IListCache<Redirect>;
    private gateway: ICreateRedirectGateway;

    constructor(cache: IListCache<Redirect>, gateway: ICreateRedirectGateway) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(redirect: Redirect) {
        const dto: RedirectDto = {
            location: redirect.location,
            redirectFrom: redirect.redirectFrom,
            redirectTo: redirect.redirectTo,
            redirectType: redirect.redirectType,
            isEnabled: redirect.isEnabled
        };

        const result = await this.gateway.execute(dto);
        const newRedirect = Redirect.create(result);
        this.cache.addItems([newRedirect]);
        return newRedirect;
    }
}
