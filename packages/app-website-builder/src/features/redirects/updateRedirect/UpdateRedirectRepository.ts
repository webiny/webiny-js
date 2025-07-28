import { IUpdateRedirectRepository } from "./IUpdateRedirectRepository.js";
import { IUpdateRedirectGateway } from "./IUpdateRedirectGateway.js";
import { RedirectDto } from "./RedirectDto.js";
import { type IListCache, Redirect } from "~/domain/Redirect/index.js";

export class UpdateRedirectRepository implements IUpdateRedirectRepository {
    private listCache: IListCache<Redirect>;
    private gateway: IUpdateRedirectGateway;

    constructor(listCache: IListCache<Redirect>, gateway: IUpdateRedirectGateway) {
        this.listCache = listCache;
        this.gateway = gateway;
    }

    async execute(redirect: Redirect) {
        const dto: RedirectDto = {
            id: redirect.id,
            redirectFrom: redirect.redirectFrom,
            redirectTo: redirect.redirectTo,
            redirectType: redirect.redirectType,
            isEnabled: redirect.isEnabled
        };

        const result = await this.gateway.execute(dto);

        this.listCache.updateItems(existingRedirect => {
            if (existingRedirect.id === redirect.id) {
                return Redirect.create(result);
            }

            return existingRedirect;
        });
    }
}
