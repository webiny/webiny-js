import { RedirectDtoMapper } from "~/domain/Redirect/RedirectDto.js";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    GetRedirectRepository as RepositoryAbstraction,
    type GetRedirectParams
} from "./abstractions.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

class GetRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private cache: RedirectsListCache.Interface) {}

    execute(params: GetRedirectParams): RedirectDto | undefined {
        const redirect = this.cache.getItem(item => item.id === params.id);
        if (redirect) {
            return RedirectDtoMapper.toDTO(redirect);
        }
        return undefined;
    }
}

export const GetRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: GetRedirectRepositoryImpl,
    dependencies: [RedirectsListCache]
});
