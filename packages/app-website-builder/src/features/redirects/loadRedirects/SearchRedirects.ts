import type { IListRedirectsGateway } from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import type { ISearchRedirectsUseCase } from "~/features/redirects/loadRedirects/ISearchRedirectsUseCase.js";
import { SearchRedirectsUseCase } from "~/features/redirects/loadRedirects/SearchRedirectsUseCase.js";
import { listRedirectsRepositoryFactory } from "~/features/redirects/loadRedirects/ListRedirectsRepositoryFactory.js";

export class SearchRedirects {
    public static getInstance(gateway: IListRedirectsGateway): ISearchRedirectsUseCase {
        const repository = listRedirectsRepositoryFactory.getRepository(gateway);
        return new SearchRedirectsUseCase(repository);
    }
}
