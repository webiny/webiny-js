import type { IListRedirectsGateway } from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import type { ILoadMoreRedirectsUseCase } from "~/features/redirects/loadRedirects/ILoadMoreRedirectsUseCase.js";
import { LoadMoreRedirectsUseCase } from "~/features/redirects/loadRedirects/LoadMoreRedirectsUseCase.js";
import { listRedirectsRepositoryFactory } from "~/features/redirects/loadRedirects/ListRedirectsRepositoryFactory.js";

export class LoadMoreRedirects {
    public static getInstance(gateway: IListRedirectsGateway): ILoadMoreRedirectsUseCase {
        const repository = listRedirectsRepositoryFactory.getRepository(gateway);
        return new LoadMoreRedirectsUseCase(repository);
    }
}
