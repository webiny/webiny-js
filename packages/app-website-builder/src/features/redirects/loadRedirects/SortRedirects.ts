import type { IListRedirectsGateway } from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import { SortRedirectsUseCase } from "~/features/redirects/loadRedirects/SortRedirectsUseCase.js";
import type { ISortRedirectsUseCase } from "~/features/redirects/loadRedirects/ISortRedirectsUseCase.js";
import { listRedirectsRepositoryFactory } from "~/features/redirects/loadRedirects/ListRedirectsRepositoryFactory.js";

export class SortRedirects {
    public static getInstance(gateway: IListRedirectsGateway): ISortRedirectsUseCase {
        const repository = listRedirectsRepositoryFactory.getRepository(gateway);
        return new SortRedirectsUseCase(repository);
    }
}
